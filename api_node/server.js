const cors = require('cors');
const express = require('express');
const app = express();
const port = 3009;
const path = require('path');
const fs = require('fs');


const allowedOrigin = '*';
const corsOptions = {
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};
app.use(cors(corsOptions));

app.get('/data', (req, res) => {
  console.log('print beginning app get');
  const fileName = req.query.param;
  console.log('fileName:', fileName);

  if (!fileName) {
    return res.status(400).json({ message: 'File name is required' });
  }

  const fileNamewithext = fileName + '.js';
  const filePath = path.join(__dirname, 'data', fileNamewithext);
  console.log('filePath:', filePath);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(404).json({ message: 'File not found' });
    } else {
      try {
        const dictionaryData = JSON.parse(data);
        res.set('Content-Type', 'application/json');
        console.log('through setting res type');
        res.json(dictionaryData);
      } catch (parseError) {
        console.error(parseError);
        res.status(500).json({ message: 'Failed to parse JSON' });
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});