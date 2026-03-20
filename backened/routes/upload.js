const express = require('express');
const router = express.Router();
const multer = require('multer');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, 'data.csv');
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'));
    }
  }
});

// Upload and parse CSV
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded!' });
    }

    const filePath = path.join(__dirname, '../uploads/data.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });

    if (result.errors.length > 0) {
      return res.status(400).json({ message: 'Error parsing CSV file!' });
    }

    const data = result.data;
    const columns = result.meta.fields;

    // Calculate statistics for numeric columns
    const stats = {};
    columns.forEach(col => {
      const values = data
        .map(row => row[col])
        .filter(val => typeof val === 'number' && !isNaN(val));

      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        stats[col] = {
          mean: (sum / values.length).toFixed(2),
          max: Math.max(...values),
          min: Math.min(...values),
          count: values.length
        };
      }
    });

    res.json({ data, columns, stats, totalRows: data.length });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;