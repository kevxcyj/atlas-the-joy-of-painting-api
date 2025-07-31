// defines api routes
const express = require('express');
const router = express.Router();
const { getEpisodes } = require('../controllers/episodeController');

router.get('/', getEpisodes);

module.exports = router;