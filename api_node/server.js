const cors = require('cors');
const express = require('express');
const app = express();
const port = 3009;
const path = require('path');
const fs = require('fs');

// Function to get the last modified date of a file
function getLastModifiedDate(filePath) {
  return fs.statSync(filePath).mtimeMs;
}

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
  const filePath = path.join(__dirname, fileNamewithext); //__dirname, 'data', fileNamewithexts
  console.log('filePath:', filePath);
  const lastUpdated = getLastModifiedDate(filePath);
  // const formattedLastUpdated = new Date(lastUpdated).toISOString();
  // Format the date to New York time with AM/PM and timezone abbreviation (EDT/EST)
  const formattedLastUpdated = new Date(lastUpdated).toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true, // Enables AM/PM format
    timeZoneName: "short" // Adds EDT/EST based on DST
  });


  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(404).json({ message: 'File not found' });
    } else {
      try {
        const dictionaryData = JSON.parse(data);
        res.set('Content-Type', 'application/json');
        console.log('through setting res type');
        res.json({"data":dictionaryData,"time":formattedLastUpdated}); //formattedLastUpdated
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