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

// function listFilesContainingSubstrings(directoryPath, substring1, substring2) {
//   try {
//       // Read all files in the directory
//       const files = fs.readdirSync(directoryPath);

//       // Filter files containing both substring1 and substring2
//       const filteredFiles = files.filter(file => file.includes(substring1) && file.includes(substring2));

//       console.log("Matching files:", filteredFiles);
//       return filteredFiles;
//   } catch (error) {
//       console.error("Error accessing directory:", error);
//       return [];
//   }
// }

// alphabetically take the first file with the Valid Time subsrting, so it prioritizes the fcst hour 2 (which is the earliest it would be). This also works for the 1) historical where we would also want to be looking at fcst hour 2, and 2) for forecast after user selects which forecast hour to see, where 
function findFirstFileWithSubstring(directory, searchString) {
  // if (!searchString.startsWith('V') || searchString.length !== 11) {
  //   throw new Error('Invalid input string format');
  // }

  // Extract date components
  const year = searchString.slice(1, 5);
  const month = searchString.slice(5, 7);
  const day = searchString.slice(7, 9);

  // Create directory based on yyyy mm dd
  const dirlook = `${directory}/${year}/${month}/${day}`;
  console.log(dirlook);

  try {
      // Read the directory and get all file names
      const files = fs.readdirSync(dirlook);

      // Filter files containing the search string
      const matchingFiles = files.filter(file => file.includes(searchString));

      if (matchingFiles.length === 0) {
          console.log('No matching files found.');
          return null;
      }

      // Sort the matching files alphabetically
      matchingFiles.sort();

      // Get the first file
      const firstFile = matchingFiles[0];
      console.log('First matching file:', firstFile);

      return `${year}/${month}/${day}/${firstFile}`; //`${directory}/${year}/${month}/${day}/${firstFile}`

  } catch (error) {
      console.error('Error reading directory:', error);
      return null;
  }
}

  // console.log("check param 3")
  // console.log(param3)

  // this is always going to be the dirpath to look based on param2

    // if (!dirName) {
  //   return res.status(400).json({ message: 'File name is required' });
  // }

app.get('/data', (req, res) => {
  console.log('print beginning app get');
  // const { param1, param2, param3 } = req.query;
  const param1 = decodeURIComponent(req.query.param1 || "").trim();
  const param2 = decodeURIComponent(req.query.param2 || "").trim();
  const param3 = decodeURIComponent(req.query.param3 || "").trim();

  console.log(param1, param2, param3);
  console.log("lengths")
  console.log(param1.length);
  console.log(param2.length);



  console.log("check param 1")
  console.log(param1)

  console.log("check param 2")
  console.log(param2)

  console.log("check param 3")
  console.log(param3)

  const dirPath = path.join(__dirname, param2); 

  console.log("some checks")
  console.log(dirPath)
  // findFirstFileWithSubstring(dirPath, "V20241121_01")

  let filePath;

  // console.log("print trues?")
  // console.log(param1 === "Live"); // Logs true or false
  // console.log(param2 === "data_camlevel"); // Logs true or false
  // console.log(param1.trim() === "Live"); // Logs true or false
  // console.log(param2.trim() === "data_camlevel"); // Logs true or false
  // console.log(typeof param1); // Should log "string"
  // console.log(typeof param2); // Should log "string"

  
  // // Update your `if` statement
  // if (param1.includes("Live") && param2.includes("data_camlevel")) {
  //   console.log("Conditions matched, entering if block");
  //   // Proceed with your logic here
  // } else {
  //   console.log("Conditions did not match");
  // }


  // find the filepath to use in the case that we're looking for the live, dot_camlevel dir
  // this should be for LIVE option
  // rather than all these if statements here, just have the UI push two levels of information to the API to do logic pull 
  if (param1.includes("Live") && param2.includes("data_camlevel")) {
    // const dirPath = path.join(__dirname, dirName); // Update with your specific directory
    // const dirName = "data_camlevel";
    // console.log('dirName:', dirName);
    // const dirPath = path.join(__dirname, param2); 
    console.log("entering first if")
    const mostRecentFile = getMostRecentFile(dirPath);
    if (!mostRecentFile) {
      return res.status(404).json({ message: 'No files found' });
    }
    console.log('most recent is')
    console.log(mostRecentFile)
    filePath = path.join(dirPath, mostRecentFile);
    console.log("setting filepath as ")
    console.log(filePath)
  } else if (param1.includes("Live") && param2.includes("data_hrrrlevel")) {
    // const dirPath = path.join(__dirname, dirName); // Update with your specific directory
    // const dirName = "data_camlevel";
    // console.log('dirName:', dirName);
    // const dirPath = path.join(__dirname, param2); 
    const firstMatchingFile = findFirstFileWithSubstring(dirPath, param3);
    if (!firstMatchingFile) {
      return res.status(404).json({ message: 'No files found' });
    }
    console.log('first matching file')
    console.log(firstMatchingFile)
    console.log("check here forecast")
    console.log(path.join(dirPath, firstMatchingFile));
    filePath = path.join(dirPath, firstMatchingFile);
  } else if (param1.includes("Forecast")) { // Additional check for the substring
    // const dirName = "data_hrrrlevel";
    // console.log('dirName:', dirName);
    // const dirPath = path.join(__dirname, dirName); 
    // const dirPath = path.join(__dirname, dirName); // Update with your specific directorys
    // const searchString = 'V20220602_02'; // Replace with the substring that is prepped for current (live) time
    console.log("inside forecast")
    console.log(dirPath)
    console.log(param3)
    const firstMatchingFile = findFirstFileWithSubstring(dirPath, param3);
    if (!firstMatchingFile) {
        return res.status(404).json({ message: 'No matching files found' });
    }
    console.log('First matching file is:');
    console.log(firstMatchingFile);
    filePath = path.join(dirPath, firstMatchingFile);
  } else if (param1.includes("Historical")) { // Additional check for the substring
    // const dirName = "data_hrrrlevel";
    // console.log('dirName:', dirName);
    // const dirPath = path.join(__dirname, dirName); 
    // const dirPath = path.join(__dirname, dirName); // Update with your specific directorys
    // const searchString = 'V20220602_02'; // Replace with the substring that is prepped for current (live) time
    console.log("inside historical")
    const firstMatchingFile = findFirstFileWithSubstring(dirPath, param3);
    if (!firstMatchingFile) {
        return res.status(404).json({ message: 'No matching files found' });
    }
    console.log('First matching file is:');
    console.log(firstMatchingFile);
    filePath = path.join(dirPath, firstMatchingFile);
  } else { // Fallback for other cases
    filePath = "/home/csutter/dashboard/api_node/data_hrrrlevel/BROKENCHECK.js";
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