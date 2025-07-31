// main server setup
const express = require('express');
const connectDB = require('./db/connect');
const episodeRoutes = require('./routes/episodes');
require('dotenv').config();

const app = express();
app.use(express.json());

connectDB();
app.use('/api/episodes', episodeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
