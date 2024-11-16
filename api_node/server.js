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

// Helper function to find the most recent file in a directory
function getMostRecentFile(dirPath) {
  const files = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.js')) // Adjust file extension as needed
    .map(file => ({
      file,
      mtime: fs.statSync(path.join(dirPath, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, descending

  return files.length > 0 ? files[0].file : null;
}

function listFilesContainingSubstrings(directoryPath, substring1, substring2) {
  try {
      // Read all files in the directory
      const files = fs.readdirSync(directoryPath);

      // Filter files containing both substring1 and substring2
      const filteredFiles = files.filter(file => file.includes(substring1) && file.includes(substring2));

      console.log("Matching files:", filteredFiles);
      return filteredFiles;
  } catch (error) {
      console.error("Error accessing directory:", error);
      return [];
  }
}


app.get('/data', (req, res) => {
  console.log('print beginning app get');
  const dirName = req.query.param;
  console.log('dirName:', dirName);

  if (!dirName) {
    return res.status(400).json({ message: 'File name is required' });
  }

  let filePath;

  // find the filepath to use in the case that we're looking for the live, dot_camlevel dir
  if (dirName === 'data_camlevel') {
    const dirPath = path.join(__dirname, dirName); // Update with your specific directory
    const mostRecentFile = getMostRecentFile(dirPath);
    if (!mostRecentFile) {
      return res.status(404).json({ message: 'No files found' });
    }
    console.log('most recent is')
    console.log(mostRecentFile)
    filePath = path.join(dirPath, mostRecentFile);
  } else { // here is where we will do the other helper functions
    const fileNamewithext = fileName + '.js';
    filePath = path.join(__dirname, fileNamewithext);
  }

  // remove for new
  // const fileNamewithext = fileName + '.js';
  // const filePath = path.join(__dirname, fileNamewithext); //__dirname, 'data', fileNamewithexts
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