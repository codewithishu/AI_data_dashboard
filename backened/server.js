const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/ai', require('./routes/ai'));

app.get('/', (req, res) => {
  res.send('Data Dashboard API is running!');
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});