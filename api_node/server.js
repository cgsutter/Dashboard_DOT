const cors = require('cors');
const express = require('express');
const app = express();
const port = 3001;
const path = require('path');
const fs = require('fs');


const allowedOrigin = 'http://169.226.68.142:3030';
const corsOptions = {
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};
app.use(cors(corsOptions));

// try 2
// const mapCors = cors({
//   origin: 'http://169.226.68.142:3030',
//   credentials: true
// });

// try 3
// const allowedOrigins = ['http://169.226.68.142:3030'];
// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   headers: ['Content-Type', 'Authorization'],
//   exposedHeaders: ['Content-Type', 'Authorization'],
//   maxAge: 3600
// }));

// try 4
// // Manually handle CORS headers OPTION 2
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "169.226.68.142:3030"); //169.226.68.141:3030
//   res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

//   // Handle preflight `OPTIONS` requests
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200);  // Send OK for preflight requests
//   }

//   next();  // Proceed to the next middleware or route handler
// });

// // Preflight (OPTIONS) Request Handling
// app.options('*', cors()); // Enable preflight across the board


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