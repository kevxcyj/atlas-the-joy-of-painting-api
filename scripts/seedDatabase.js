// transforms data
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// database connection
const connectDB = require('../db/connect');
const Episode = require('../models/Episode');

// file paths
const COLORS_FILE = path.join(__dirname, '../data/colors.csv');
const SUBJECTS_FILE = path.join(__dirname, '../data/subjects.csv');
const DATES_FILE = path.join(__dirname, '../data/dates.txt');

// reads csv file, returns an array of objects
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// reads dates file, returns an array of episode objects
function readDatesFile(filePath) {
  const rawText = fs.readFileSync(filePath, 'utf-8');
  const lines = rawText.trim().split('\n');

  return lines
    .map((line, index) => {
      if (!line.trim()) {
        console.warn(`Skipping empty line at index ${index}`);
        return null;
      }

      const [title, date] = line.split('" (');
      if (!title || !date) {
        console.warn(`Malformed line (missing title or date) at index ${index}:`, line);
        return null;
      }

    //   const match = title.match(/S(\d{2})E(\d{2})/);
    //   if (!match) {
    //     console.warn(`Invalid episode code in title at index ${index}:`, title);
    //     return null;
    //   }

      return {
        title: title.replace(/ \(.*\)/, '').trim(),
        // season: parseInt(match[1], 10),
        // episode: parseInt(match[2], 10),
        broadcastDate: date.replace(/\).+/, '')
      };
    })
    .filter(Boolean); // remove null entries
}

// extract colors
function transformColors(row) {
  const colorNames = [];
  const hexCodes = [];

  Object.keys(row).forEach((key) => {
    if (key.startsWith('color')) {
      const index = key.match(/color(\d+)/)[1];
      if (row[key]) {
        colorNames[Number(index) - 1] = row[key];
      }
    } else if (key.startsWith('hex')) {
      const index = key.match(/hex(\d+)/)[1];
      if (row[key]) {
        hexCodes[Number(index) - 1] = row[key];
      }
    }
  });

  return colorNames.map((name, i) => ({
    name,
    hex: hexCodes[i] || '#000000'
  }));
}

function transformSubjects(row) {
  const subjects = [];
  Object.keys(row).forEach((key) => {
    if (row[key] === '1') {
      subjects.push(key);
    }
  });
  return subjects;
}

async function seedDatabase() {
  await connectDB();

  console.log('Reading data...');
  const [colorsData, subjectsData] = await Promise.all([
    readCSV(COLORS_FILE),
    readCSV(SUBJECTS_FILE)
  ]);
  const datesData = readDatesFile(DATES_FILE);
  console.log(...datesData);

  const episodeDocs = [];

  for (let i = 0; i < datesData.length; i++) {
    const dateRow = datesData[i];
    const colorRow = colorsData[i] || {};
    const subjectRow = subjectsData[i] || {};

    const colors = transformColors(colorRow);
    const subjects = transformSubjects(subjectRow);

    const episode = {
      title: dateRow.title,
      season: dateRow.season,
      episode: dateRow.episode,
      broadcastDate: dateRow.broadcastDate,
      youtubeURL: colorRow.youtube || '',
      imageURL: colorRow.img || '',
      colors,
      subjects
    };

    episodeDocs.push(episode);
  }

  console.log('Clearing old episodes...');
  await Episode.deleteMany({});
  console.log('Inserting new episodes...');
  await Episode.insertMany(episodeDocs);

  console.log(`Seed complete: ${episodeDocs.length} episodes inserted`);
  mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('ETL failed:', err);
  mongoose.disconnect();
});