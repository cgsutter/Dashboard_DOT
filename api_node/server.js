const cors = require('cors');
const express = require('express');
const app = express();
const port = 3009;
const path = require('path');
const fs = require('fs');

// notes 3/3
// difference between this version and development (main branch) version is just the app.get('/dot-api', (req, res) => { AS OPPOSED TO app.get('/data', (req, res) => {
// Need to add in the get camera API, but that may be another set up?

// pushing change to production git branch
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

// // EDIT HERE 3/3 COME BACK AND SET THIS UP
// app.get("/get-image", (req, res) => {
//   console.log("Entering /get-image");

//   const imagePath = req.query.path; // Local image path from UI
//   if (!imagePath) {
//     return res.status(400).json({ error: "No image path provided" });
//   }

//   // Extract filename from the full path
//   // const filename = path.basename(imagePath);

//   // Assuming images are stored in a known directory
//   // const imageDir = "/your/local/image/directory"; // <--- CHANGE THIS
//   // const filePath = path.join(imageDir, filename);

//   console.log("Looking for file:", imagePath);

//   // Check if the file exists
//   if (!fs.existsSync(imagePath)) {
//     console.log("File not found:", imagePath);
//     return res.status(404).json({ error: "Image not found" });
//   }

//   // Send the image file as a response
//   res.sendFile(imagePath);
// });


// for historical, find the file that has closest modification time to the requested user date time, and consider looking between 3 directories
function findClosestFile(parentDir, dirs, targetDate) {
  console.log("inside the findClosestFile function BEGIN")
  console.log("target date?/")
  console.log(targetDate)
  console.log(typeof targetDate)
  // const targetDateStr = "Thu Nov 21 2024 15:58:34 GMT-0500 (Eastern Standard Time)";
  const targetDateUTC = new Date(
    targetDate.replace("GMT-0500 (Eastern Standard Time)", "+0000")
  );
  console.log(targetDateUTC)
  console.log(typeof targetDateUTC)

  let closestFile = null;
  let closestDiff = Infinity;

  dirs.forEach((directory) => {
    const fullPath = path.join(parentDir, directory);
    console.log(fullPath)

    if (fs.existsSync(fullPath)) {
      fs.readdirSync(fullPath).forEach((filename) => {
        const filePath = path.join(fullPath, filename);
        const stats = fs.statSync(filePath);

        const fileDate = stats.mtime;
        const diff = Math.abs(targetDateUTC - fileDate);

        if (diff < closestDiff) {
          closestDiff = diff;
          closestFile = filePath;
        }
      });
    } else {
      console.log(`Directory not found: ${fullPath}. Skipping...`);
    }
  });
  console.log("END Inside closest file is:")

  console.log(closestFile)

  return closestFile;
}

// For forecast, list times fro the options for user to select. But if the time doesn't exist (HRRR lag, file missed, etc), we can point the user to the next closest time. This function and the next one does this. This first function lists 6 hours preceeding and proceeding the requested time. The second function checks which of those files exist. In both functions, order is preserved so that still, the user selected time is prioritized, and from there we move to +/-1 preceeding or prceeding hours, then +/- 2
function getFileAccountingForUnavail(targetFileStr) {
    // Parse the input file to extract the date and hour
    const year = parseInt(targetFileStr.substring(1, 5), 10);
    const month = parseInt(targetFileStr.substring(5, 7), 10) - 1; // Month is zero-based in JavaScript
    const day = parseInt(targetFileStr.substring(7, 9), 10);
    const hour = parseInt(targetFileStr.substring(10, 12), 10);

    const targetDate = new Date(Date.UTC(year, month, day, hour));

    // Generate nearby timestamps (within 6 hours before and after)
    const nearbyFiles = [];
    for (let offset = -6; offset <= 6; offset++) {
        const nearbyDate = new Date(targetDate);
        nearbyDate.setUTCHours(targetDate.getUTCHours() + offset);

        // Format the nearby timestamp into the required file format
        const formattedYear = nearbyDate.getUTCFullYear();
        const formattedMonth = String(nearbyDate.getUTCMonth() + 1).padStart(2, '0'); // Month is zero-based
        const formattedDay = String(nearbyDate.getUTCDate()).padStart(2, '0');
        const formattedHour = String(nearbyDate.getUTCHours()).padStart(2, '0');
        const nearbyFile = `V${formattedYear}${formattedMonth}${formattedDay}_${formattedHour}`;

        // Skip adding the target file to the nearby list again
        if (offset === 0) continue;

        nearbyFiles.push({
            file: nearbyFile,
            priority: Math.abs(offset) // Closer times have lower priority
        });
    }

    // Sort by priority (closer times first)
    nearbyFiles.sort((a, b) => a.priority - b.priority);

    const filesinorder = [targetFileStr, ...nearbyFiles.map(entry => entry.file)];
    console.log()
    // Add the target file as the first choice
    return filesinorder;
}


function seeIfFilesInListExist(baseDir, fileList) {
  // Extract unique dates from fileList
  const uniqueDates = [...new Set(fileList.map(file => {
    const year = file.substring(1, 5);
    const month = file.substring(5, 7);
    const day = file.substring(7, 9);
    return `/${year}/${month}/${day}`;
  }))];

  const matchingFiles = [];

  // Iterate over fileList to retain the order
  fileList.forEach(file => {
    const year = file.substring(1, 5);
    const month = file.substring(5, 7);
    const day = file.substring(7, 9);
    const datePath = `/${year}/${month}/${day}`;
    const dirPath = path.join(baseDir, datePath);

    // Find matching files for each entry in fileList
    if (fs.existsSync(dirPath)) {
      const filesInDir = fs.readdirSync(dirPath);
      const matches = filesInDir.filter(f => f.includes(file));

      // Sort the matched files alphabetically
      matches.sort();

      // Add the sorted matches to the final list
      matchingFiles.push(...matches.map(matchedFile => path.join(datePath, matchedFile)));
    }
  });

  return matchingFiles;
}




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



// ADDED FROM HERE DOWN 3/3
function convertToEST(filePath) {
  // Step 1: Extract the date and hour from the file path
  const regex = /\/(\d{4})\/(\d{2})\/(\d{2})\/F_V(\d{8})_(\d{2})_/;
  const match = filePath.match(regex);

  if (match) {
    const year = match[1];
    const month = match[2];
    const day = match[3];
    const hour = match[5];

    // Step 2: Create a Date object in UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour));
    console.log(1);
    console.log(utcDate);

    // Step 3: Convert the date to EST (UTC - 5)
    // Using Intl.DateTimeFormat to display the date in EST
    const estDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000)); // UTC - 5 hours for EST
    console.log(2);
    console.log(estDate);
    console.log(typeof estDate);
    
    // Step 4: Format it as a string
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric', 
      second: 'numeric', 
      hour12: false, 
      timeZone: 'America/New_York'
    };

    console.log(3);
    const time3 = estDate.toLocaleString('en-US', options);
    console.log(time3)
    
    return estDate;
  }

  return null;  // Return null if the regex doesn't match
}

// new 12/20
function parseAndConvertToEST(inputString) {
  // Define a function to convert UTC date to EST
  function convertToEST(utcDate) {
      const options = {
          timeZone: 'America/New_York',
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
      };
      return new Intl.DateTimeFormat('en-US', options).format(utcDate);
  }

  let regexC = /C_(\d{4})(\d{2})(\d{2})_(\d{2})_(\d{2})/; // Regex for C_ type format
  let regexF = /F_V(\d{4})(\d{2})(\d{2})_(\d{2})/;       // Regex for F_ type format

  let matchC = inputString.match(regexC);
  let matchF = inputString.match(regexF);

  if (matchC) {
      // Extract date components for C_ format
      let year = matchC[1];
      let month = matchC[2] - 1; // Month is 0-indexed in JavaScript
      let day = matchC[3];
      let hour = matchC[4];
      let minute = matchC[5];

      // Create a UTC date
      let utcDate = new Date(Date.UTC(year, month, day, hour, minute));

      // Convert to EST and return
      return convertToEST(utcDate);
  } else if (matchF) {
      // Extract date components for F_ format
      let year = matchF[1];
      let month = matchF[2] - 1; // Month is 0-indexed in JavaScript
      let day = matchF[3];
      let hour = matchF[4];

      // Create a UTC date
      let utcDate = new Date(Date.UTC(year, month, day, hour));

      // Convert to EST and return
      return convertToEST(utcDate);
  } else {
      throw new Error("Invalid input string format.");
  }
}

// Test the function with sample inputs
try {
    let testStringC = "/home/csutter/dashboard/data/data_camlevel/2024/12/20/C_20241220_16_30.js";
    let testStringF = "/home/csutter/dashboard/data/data_hrrrlevel/2024/12/20/F_V20241220_17_FH03.js";

    console.log(parseAndConvertToEST(testStringC)); // Example output: "Friday, December 20, at 11:30 AM EST"
    console.log(parseAndConvertToEST(testStringF)); // Example output: "Friday, December 20, at 12:00 PM EST"
} catch (error) {
    console.error(error.message);
}


// this takes the query from UI (5 parameters that are user defined), and then finds the right 1) file and 2) time (just for logging) from those 5 parameters. The 5 params include things like 1) Live vs Fcst vs Historical 2) Cam-level vs Hrrr-level 3) the Date selected from dropdown if it's forecast list, etc. 
app.get('/dot-api', (req, res) => {
  console.log('print beginning app get');
  // const { param1, param2, param3 } = req.query;
  const param1 = decodeURIComponent(req.query.param1 || "").trim();
  const param2 = decodeURIComponent(req.query.param2 || "").trim();
  const param3 = decodeURIComponent(req.query.param3 || "").trim();
  const param4 = decodeURIComponent(req.query.param4 || "").trim();
  const param5 = decodeURIComponent(req.query.param5 || "").trim();
  const param6 = decodeURIComponent(req.query.param6 || "").trim();

  console.log(param1, param2, param3, param4, param5);

  // params 1 through 5 are passed back from the user's selection in UI to the API to find the file of interest... 
  // param 1 is indicating the time frame of interest - Live, Forecast, or Historical - which affects how the file of interest is found
  console.log("check param 1")
  console.log(param1)
  // param 2 is indicating to grab either cam-level or hrrr-level data - which affects how the file of interest is found
  console.log("check param 2")
  console.log(param2)
  // param 3 is only relevent for hrrr-level files -- bc depending what valid time is requested from user, need to grab the most relevant hrrrr file (the one with the smallest FH)
  console.log("check param 3")
  console.log(param3)
  // param 4 and 5 only relevant for cam-level files -- bc depending what requested time is passed back from user (now, or historical) need to grab the closest relevant file
  // paran 4 is the list of date dirs to consider for finding closest file
  console.log("check param 4")
  console.log(param4)
  // console.log(typeof param4)
  // param 5 is the requested date time from user
  console.log("check param 5")
  console.log(param5)

  // image path if click, see what's grabbed from UI
  console.log("check param 6")
  console.log(param6)

  const dateList = param4.split(',');
  // console.log(dateList)
  // console.log(typeof dateList)

  // console.log("check param 5")
  // console.log(param5)

  const dirPath = path.join("/home/csutter/dashboard/data", param2); 

  // console.log("some checks")
  // console.log(dirPath)
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

  if (param6 === "") {

    if (param1.includes("Live") && param2.includes("data_camlevel")) {
      // const dirPath = path.join(__dirname, dirName); // Update with your specific directory
      // const dirName = "data_camlevel";
      // console.log('dirName:', dirName);
      // const dirPath = path.join(__dirname, param2); 

      // intermediate to see if getting the function stuff working
      console.log("entering first if")
      const do_try = findClosestFile(dirPath, dateList, param5); //"/home/csutter/dashboard/api_node/data_camlevel/"
      console.log("printint result of fn below!!")
      console.log(do_try)
      console.log("done first if AFTER RUN FN")


      // old way (but with data_camlevel/allonedir)
      // const mostRecentFile = getMostRecentFile(dirPath);
      // if (!mostRecentFile) {
      //   return res.status(404).json({ message: 'No files found' });
      // }
      // console.log('most recent is')
      // console.log(mostRecentFile)
      // filePath = path.join(dirPath, mostRecentFile);

      filePath = do_try;
      console.log("setting filepath as ")
      console.log(filePath)
      console.log("done first if")
      console.log("PRINTING TIME HERE")
      usedTimePrintUI = convertToEST(filePath)
      console.log(usedTimePrintUI)
      console.log("done first if")
      datestrEST = parseAndConvertToEST(filePath)
      console.log("NEW: date time parsed in EST")
      console.log(datestrEST)
      



    } else if (param1.includes("Live") && param2.includes("data_hrrrlevel")) {
      // const dirPath = path.join(__dirname, dirName); // Update with your specific directory
      // const dirName = "data_camlevel";
      // console.log('dirName:', dirName);
      // const dirPath = path.join(__dirname, param2); 
      console.log("entering second if")
      const firstMatchingFile = findFirstFileWithSubstring(dirPath, param3);
      if (!firstMatchingFile) {
        return res.status(404).json({ message: 'No files found' });
      }
      console.log('first matching file')
      console.log(firstMatchingFile)
      console.log("check here forecast")
      console.log(path.join(dirPath, firstMatchingFile));
      filePath = path.join(dirPath, firstMatchingFile);
      console.log("done second if else")
      console.log("PRINTING TIME HERE")
      usedTimePrintUI = convertToEST(filePath)
      console.log(usedTimePrintUI)
      console.log("done second if else")
      datestrEST = parseAndConvertToEST(filePath)
      console.log("NEW: date time parsed in EST")
      console.log(datestrEST)
    } else if (param1.includes("Forecast")) { // Additional check for the substring
      // const dirName = "data_hrrrlevel";
      // console.log('dirName:', dirName);
      // const dirPath = path.join(__dirname, dirName); 
      // const dirPath = path.join(__dirname, dirName); // Update with your specific directorys
      // const searchString = 'V20220602_02'; // Replace with the substring that is prepped for current (live) time
      console.log("entering third if")
      console.log("inside forecast")
      console.log(dirPath)
      console.log(param3)
      const filesToConsider = getFileAccountingForUnavail(param3) // added 12/18
      console.log("new function")
      console.log(filesToConsider)
      const filesThatExist = seeIfFilesInListExist('/home/csutter/dashboard/data/data_hrrrlevel', filesToConsider)
      console.log("function 2")
      console.log(filesThatExist)
      const filetoload = filesThatExist[0]
      console.log(filetoload)
      // dont need this any more bc finding first file with new methods above
      // const firstMatchingFile = findFirstFileWithSubstring(dirPath, filetoload);//change last one to param3 and comment out above line 
      // if (!firstMatchingFile) {
      //     return res.status(404).json({ message: 'No matching files found' });
      // }
      // console.log("through here")
      // console.log('First matching file is:');
      // console.log(firstMatchingFile);
      console.log("PRINTING TIME HERE")
      usedTimePrintUI = convertToEST(filetoload)
      console.log(usedTimePrintUI)
      filePath = path.join(dirPath, filetoload); //firstMatchingFile
      console.log("done third if else")
      datestrEST = parseAndConvertToEST(filePath)
      console.log("NEW: date time parsed in EST")
      console.log(datestrEST)

    } else if (param1.includes("Historical") && param2.includes("data_camlevel")) {
      console.log("entering fourth if else")
      const do_try2 = findClosestFile(dirPath, dateList, param5);
      filePath = do_try2;
      console.log("setting filepath as ")
      console.log(filePath)
      console.log("done fourth if else")
      console.log("PRINTING TIME HERE")
      usedTimePrintUI = convertToEST(filePath)
      console.log(usedTimePrintUI)
      console.log("done fourth if else")
      datestrEST = parseAndConvertToEST(filePath)
      console.log("NEW: date time parsed in EST")
      console.log(datestrEST)


    } else if (param1.includes("Historical") && param2.includes("data_hrrrlevel")) { // Additional check for the substring
      // const dirName = "data_hrrrlevel";
      // console.log('dirName:', dirName);
      // const dirPath = path.join(__dirname, dirName); 
      // const dirPath = path.join(__dirname, dirName); // Update with your specific directorys
      // const searchString = 'V20220602_02'; // Replace with the substring that is prepped for current (live) time
      console.log("entering 5fth if")
      console.log("inside historical")

      const firstMatchingFile = findFirstFileWithSubstring(dirPath, param3);
      if (!firstMatchingFile) {
          return res.status(404).json({ message: 'No matching files found' });
      }
      console.log('First matching file is:');
      console.log(firstMatchingFile);
      filePath = path.join(dirPath, firstMatchingFile);
      // console.log("done fifth if else")
      console.log("PRINTING TIME HERE")
      usedTimePrintUI = convertToEST(filePath)
      console.log(usedTimePrintUI)
      console.log("done fifth if else")
      datestrEST = parseAndConvertToEST(filePath)
      console.log("NEW: date time parsed in EST")
      console.log(datestrEST)
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
          res.json({"data":dictionaryData,"time":datestrEST}); // THIS is the main response, what is returned and sent back from  API to UI. // Need to add the image data here and will need to process it to a non local image path and then will have to also update the fetch inside Map.js accordingly. Not just a matter of adding in the img_path with all the rest of teh model return stuff since that is a local file. 
        } catch (parseError) {
          console.error(parseError);
          res.status(500).json({ message: 'Failed to parse JSON' });
        }
      }
    });
  } else {
    // Only proceed if param6 is NOT empty
    console.log("Looking for file:", param6);
  
    // Check if the file exists
    if (!fs.existsSync(param6)) {
      console.log("File not found:", param6);
      return res.status(404).json({ error: "Image not found" });
    }
  
    // Send the image file as a response
    return res.sendFile(param6);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
