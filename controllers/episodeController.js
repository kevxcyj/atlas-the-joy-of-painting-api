const Episode = require('../models/Episode');
const Subject = require('../models/Subject');

// helper to parse month name or number to 0-11 index
function parseMonth(month) {
  if (!month) return null;
  if (typeof month === 'string') {
    const lower = month.toLowerCase();
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    let idx = months.findIndex(m => m.startsWith(lower));
    if (idx >= 0) return idx;
    let asNum = parseInt(month);
    if (!isNaN(asNum) && asNum >= 1 && asNum <= 12) return asNum - 1;
  }
  return null;
}

const getEpisodes = async (req, res) => {
  try {
    const {
      months,
      subjects,
      colors,
      mode = 'and'  // default mode
    } = req.query;

    // Parse query string parameters into arrays (or empty arrays)
    const monthArray = months ? months.split(',').map(m => m.trim()) : [];
    const subjectArray = subjects ? subjects.split(',').map(s => s.trim()) : [];
    const colorArray = colors ? colors.split(',').map(c => c.trim()) : [];

    const andConditions = [];
    const orConditions = [];

    // Month filter
    if (monthArray.length) {
      const monthNums = monthArray.map(parseMonth).filter(m => m !== null);

      const monthCondition = {
        $expr: {
          $in: [
            { $subtract: [{ $month: "$broadcastDate" }, 1] }, // MongoDB $month returns 1-12, convert to 0-11
            monthNums
          ]
        }
      };

      if (mode === 'and') andConditions.push(monthCondition);
      else orConditions.push(monthCondition);
    }

    // Subject filter
    if (subjectArray.length) {
      // Find subject IDs
      const matchingSubjects = await Subject.find({ name: { $in: subjectArray } });
      const subjectIds = matchingSubjects.map(s => s._id);

      const subjectCondition = {
        subjects: { $in: subjectIds }
      };

      if (mode === 'and') andConditions.push(subjectCondition);
      else orConditions.push(subjectCondition);
    }

    // Color filter
    if (colorArray.length) {
      const colorCondition = {
        'colors.name': { $in: colorArray }
      };

      if (mode === 'and') andConditions.push(colorCondition);
      else orConditions.push(colorCondition);
    }

    let query = {};
    if (mode === 'and') {
      if (andConditions.length) query = { $and: andConditions };
    } else {
      if (orConditions.length) query = { $or: orConditions };
    }

    // Fetch episodes with populated subjects
    const episodes = await Episode.find(query)
      .populate('subjects', 'name')
      .sort({ broadcastDate: 1 });

    res.json({ count: episodes.length, episodes });
  } catch (error) {
    console.error('Error in getEpisodes:', error);
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
};

module.exports = { getEpisodes };