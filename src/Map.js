// import * as React from 'react';
import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import camdata from "../data/dot_cam_latlon.js";
import Tooltip from './Tooltip'; // Import the Tooltip component
import {convertToGMT} from './timing_helper.js';
import {roundTimeToHour} from './timing_helper.js';
import {prepFileString} from './timing_helper.js';
import {prepListForecastOptions} from './timing_helper.js';
import {prepFileString_fcst} from './timing_helper.js';
import {datestring_tofilenamestring} from './timing_helper.js';
import {prepDateObject_fcst} from './timing_helper.js';
import {prevday_nextday} from './timing_helper.js';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";  // 

import { api_token_mapbox } from '../credentials.js';
// const token = MY_CONSTANT 
mapboxgl.accessToken = api_token_mapbox;


// This entire Map function is called on in App.js. Inputs are props (state) which is macro map details, like centered lat/lon and zoom. 
const Map = (props) => {
  const mapContainer = useRef(null);
  const { state } = props; 
  // const [autoUpdate, setAutoUpdate] = useState(false); // Track if auto-update is enabled
  const [selectedDictionary, setSelectedDictionary] = useState('camlocs_current'); // selectedDictionary is the for the corresponding case that the user selected
  const [selectedFCSTDictionary, setSelectedFCSTDictionary] = useState('FCST_current'); // equivalent of the above but for fcst data
  const [data, setData] = useState({}); // Based on the selectedDictionary, load the corresponding data using the API and store it in data
  const [FCSTdata, setFCSTData] = useState({}); // equivalent of the above but for fcst data
  const [mapInstance, setMapInstance] = useState(null);
  const [lastUpdateCam, setLastUpdateCam] = useState(null);
  const [lastUpdateFCST, setLastUpdateFCST] = useState(null);
  const [showdots, setShowdots] = useState(true); // Toggle for FCST data
  const [showFCST, setShowFCST] = useState(true); // Toggle for FCST data
  const [subdir, setSubdir] = useState('data_camlevel'); // this will be adjusted based on the selection of Context (this is not a toggle itself, but changed based on user toggle)
  const [selectedContext, setSelectedContext] = useState('Live'); // "Live" or "Forecast" or "Historical"
  // these are used so that code runs in order that we need. For example, if selectContext changes, we need to do a set of thing (date, filename, etc) BEFORE we try to read in the data and load the map, so by having these flags change after selectedContext change, and using these flags as the dependency for loading data (data fetch). o/w, if just rely on selectContext change for fetching data, react may try to fetch data prior to setting filename, etc (which we need for proper loading!)
  const [flagLive, setFlagLive] = useState(true);
  const [flagFCST, setFlagFCST] = useState(false);
  const [flagHist, setFlagHist] = useState(false);
  // Need to set initial values so that the map loads correctly under the initialization of Live. By default in React, these initial state variables are set sequentially. We need them to be dynamic based on the time that the site is loaded, but they still need initial values. Without having in initial values (for example, if we wait for a useEffect to load based on the setDate state), the initial site load won't load. So we need the initial values to be functions (dynamic) of the current time, we need the initialized states to depend on selectedDate, as done below, and it works sequentially as needed. Note that we *also* have these setState functions evaluated in a useEffect to account for the case that the user clicks Forecast or Historical, and then *goes back* to Live.
  const [selectedDateCamET, setSelectedDateCamET] = useState(new Date());  // here
  const [selectedDateCam, setSelectedDateCam] = useState(convertToGMT(selectedDateCamET));
  const [adjacentDaysLive, setAdjacentDaysLive]= useState(prevday_nextday(selectedDateCam));
  const [selectedDateET, setSelectedDateET] = useState(new Date());  // here
  const [selectedDate, setSelectedDate] = useState(convertToGMT(selectedDateET));  // Default to the current date and time bc default loading selection, setContext, is Live
  const [roundedToHr, setRoundedToHr] = useState(roundTimeToHour(selectedDate));
  const [stringRoundedToHr, setStringRoundedToHr] = useState(prepFileString(roundedToHr)); 
  const [fileLiveOrHistHRRR, setFileLiveOrHistHRRR] =  useState(datestring_tofilenamestring(stringRoundedToHr)); 
  // When setContext changes, these other state variables are dynamically loaded. They dont affect initial load bc we default to "Live" initially
  const [roundedToHrET, setRoundedToHrET] = useState(roundTimeToHour(selectedDateET));
  const [forecastOptions, setForecastOptions] = useState([]); // State to hold date options
  const [selectedForecastET, setSelectedForecastET] = useState('');  //here
  const [selectedForecastETDate, setSelectedForecastETDate] = useState(''); 
  const [selectedForecast, setSelectedForecast] = useState(''); // user selected forecast which is a string (which will need to then prepare the filename, see below)
  const [fileForecast, setFileForecast] = useState(''); // for when *after* the use selects which forecast time based on dropdown
  const [selectedPastET, setSelectedPastET] = useState(''); // here
  const [selectedPast, setSelectedPast] = useState(''); // user selected
  const [adjacentDays, setAdjacentDays] = useState([]);
  const [filePast, setFilePast] = useState(''); // for when *after* the use selects which forecast time based on dropdown



  // const [level, setLevel] = useState(''); // need this extra
  // these should be for historic only
  // For the 
  // const [autoRefresh, setAutoRefresh] = useState(true);
  // const [current, setCurrent] = useState('')
  // const [case1, setcase1] = useState('')
  // const [fcst2hr, setfcst2hr] = useState('')
  // const [fcst2hr, setfcst2hr] = useState('')

  // console.log("initial print item")
  // console.log(selectedDate)

  // // Toggle handler for checkbox
  // const handleToggleChange = () => {
  //   setShowFCST(!showFCST);
  // };

  // const handleToggleChange = () => {
  //   setShowdots(!showdots);
  // };

  // console.log("SELECTED DATE FOR HISTORICAL CHECK")
  // console.log(selectedDate)

  // Return text for the dashboard title based on the user's selected case
  const getTitle = () => {
    switch (selectedContext) {
      case 'Live':
        return 'current road surface conditions';
      case 'Forecast':
        return 'forecasted future road surface conditions';
      case 'Historical':
        return 'past road surface conditions';
      default:
        return 'road surface conditions';
    }
  };

  // First: set up how to handle user interaction (dropdown of cases, or selection checkboxes of classes)

  // Set which conditions to map. Initially, only map the 4 main ones
  const [conditions, setConditions] = useState({
    snow_severe: true,
    snow: true,
    wet: true,
    dry: true,
    poor_viz: true,
    obs: true,
  });

  // Related to above, define this function to handle changes to the road surface condition check boxes based on user interaction on dashbaord
  const handleConditionChange = (event) => {
    setConditions((prevConditions) => ({
      ...prevConditions,
      [event.target.name]: event.target.checked,
    }));
  };

  // Handle dropdown change (Live or Historical)
  const handleContextChange = (e) => {
    const usercontext = e.target.value;
    setSelectedContext(usercontext); // change user context (see where this is needed)
    // also change subdir
    // maybe better to move these under a useeffect although can do similar things?
 
  };

  // anytime the context changes, refresh to have certain constants reset (e.g. for Live view, both cams and everywhere should be toggled yes. For forecast view, cam data should be unchecked (greyed out even))
  useEffect(() => {
    if (selectedContext === "Live") { 
      // set the subdir for the API to search for the most recent file for camlevel
      // setSubdir("data_camlevel");
      // set the current datetime for the API to search for the best hrrr-level data. Note that upon loading, the default will use the current time, but need this in here in case the user switches from live, to historical, and then back to live (need to reset it to current time)
      setSelectedDateCamET(new Date());
      setSelectedDateCam(convertToGMT(selectedDateCamET));
      setAdjacentDaysLive(prevday_nextday(selectedDateCam));
      console.log("break 1 A");
      // const now = new Date(); 
      // console.log(now); 
      setSelectedDateET(new Date());
      setSelectedDate(convertToGMT(selectedDateET));
      // console.log(selectedDate) // move to log in useeffect to ensure we're seeing the updated value
      console.log("break 1 B");
      setShowdots(true);
      setShowFCST(true);
      console.log("break 1 C");
      setFlagLive(true);
      // setFlagFCST(false);
      // setFlagHist(false);
      console.log("break 1 D");
      setRoundedToHr(roundTimeToHour(selectedDate));
      // console.log(roundedToHr);
      console.log("break 1 E");
      setStringRoundedToHr(prepFileString(roundedToHr)); 
      // console.log(stringRoundedToHr);
      console.log("break 1 F");
      setFileLiveOrHistHRRR(datestring_tofilenamestring(stringRoundedToHr));
      // console.log(fileLiveOrHistHRRR) ;
      console.log("break 1 G");
      // console.log("ran initial useeffect w ifs, Live")
      // console.log(selectedDate)

    } else if (selectedContext === "Historical") { // if the user selects historical or forecast, they will select the datetime they want and it will be set that way
      console.log("break 3 A")
      setSubdir("data_hrrrlevel");
      setShowdots(true);
      setShowFCST(true);
      console.log("break 3 B")
      setFlagLive(false);
      setFlagFCST(false);
      setFlagHist(true);
      console.log("break 3 C")
      // backfill based on user selection NEED TO DO
    } else if (selectedContext === "Forecast") {
      // setSubdir("data_hrrrlevel");
      console.log("break 2 A");
      setShowdots(false);
      setShowFCST(true);
      console.log("break 2 B");
      setFlagLive(false);
      setFlagFCST(true);
      setFlagHist(false);
      console.log("break 2 C");
      // const now_fcst = new Date(); // KS check this date stuff, why updating weird times not seem to be based on refresh (can update one second apart and it will be like 30 sec diff, or vice versa.)
      setSelectedDateET(new Date());
      // console.log(selectedDateET)
      // setSelectedDate(selectedDateET);
      // console.log(selectedDate); see comment in Live, moved to useeffect
      // console.log("break 2 D");
      setRoundedToHrET(roundTimeToHour(selectedDateET));
      // console.log(roundedToHr);
      console.log("break 2 E");
      setForecastOptions(prepListForecastOptions(roundedToHrET));
      // console.log(forecastOptions)
      console.log("break 2 F");

      // set the initial forecast selection 
      // setSelectedForecast(forecastOptions[0]);
      // console.log("break 2 GG");
    }
  }, [selectedContext]); 


  useEffect (() => {
    console.log("selectedDateET:")
    console.log(selectedDateET)
  }, [selectedDateET]);

  useEffect (() => {
    console.log("TYPE OF SELECTED DATE")
    console.log(typeof selectedDate)
  }, [selectedDate]);

  useEffect (() => {
    console.log("selectedDate")
    console.log(selectedDate)
  }, [selectedDate]);

  useEffect (() => {
    console.log("roundedToHr:")
    console.log(roundedToHr)
  }, [roundedToHr]); 

  useEffect (() => {
    console.log("roundedToHrET:")
    console.log(roundedToHrET)
  }, [roundedToHrET]); 

  useEffect (() => {
    console.log("stringRoundedToHr:")
    console.log(stringRoundedToHr)
  }, [stringRoundedToHr]); 


  useEffect (() => {
    console.log("fileLiveOrHistHRRR:")
    console.log(fileLiveOrHistHRRR)
  }, [fileLiveOrHistHRRR]); 
        
  useEffect (() => {
    console.log("selectedDate:")
    console.log(selectedDate)
  }, [selectedDate]); 

  useEffect (() => {
    console.log("forecastOptions:")
    console.log(forecastOptions)
  }, [forecastOptions]); 

 
  useEffect(() => {
    console.log("LOGGING AFTER LETTING TIME")
    console.log("forecastOptions updated:", forecastOptions);
  }, [forecastOptions]); // KS part 2: have to make sure to log it after it's been updated. Even if logged directly after running set State, React may run the log before actually doing the set State, so it won't show the updated value

  useEffect(() => {
    if (flagFCST === true) { 
      console.log("logging forecast options:)")
      console.log(forecastOptions)
      console.log(forecastOptions[0])

      console.log("auto initially select the selectedForecast (before user has a chance to select a different one), to the first value")
      setSelectedForecastET(forecastOptions[0]);
    }
  }, [forecastOptions]) ;

  useEffect (() => {
    console.log("selectedForecastET:")
    console.log(selectedForecastET)
  }, [selectedForecastET]); 



  useEffect(() => {
    if (flagFCST === true) { 
      console.log("upon inital load of selected forecast:")
      console.log(selectedForecast)
    }
  }, [selectedForecast]) ;

  useEffect(() => {
    if (flagFCST === true) { 
      console.log("parse the date from the user's selected fcst date")
      setSelectedForecastETDate(prepDateObject_fcst(selectedForecastET));
    }
  }, [selectedForecastET]) ;
  // selectefForecastETDate
  
  useEffect(() => {
    if (flagFCST === true) { 
      console.log("make sure new ET date loaded")
      console.log(selectedForecastETDate)
    }
  }, [selectedForecastETDate]) ;

  // old way
  // useEffect(() => {
  //   if (flagFCST === true) { 
  //     console.log("running useEffect for Forecast-specific user selection")
  //     setFileForecast(prepFileString_fcst(selectedForecast));
  //     // console.log(fileForecast) // needs to be outside useeffect to make sure updated
  //     console.log("break 2 G");
  //   }
  // }, [selectedForecast]) ;

  useEffect(() => {
    if (flagFCST === true) { 
      console.log("prepare fcst file name part 1")
      setSelectedForecast(convertToGMT(selectedForecastETDate));
      console.log("break 2 G");
    }
  }, [selectedForecastETDate]) ;

  useEffect(() => {
    if (flagFCST === true) { 
      console.log("prepare fcst file name part 2")
      setFileForecast(datestring_tofilenamestring(prepFileString(selectedForecast)))
    }
  }, [selectedForecast]) ;



  useEffect(() => {
    if (flagFCST === true) { 
      console.log("GMT maint selected fcst")
      console.log(selectedForecast)
      console.log(prepFileString(selectedForecast))
      console.log(datestring_tofilenamestring(prepFileString(selectedForecast)))
    }
  }, [selectedForecast]) ;

  useEffect(() => {
    if (flagFCST === true) { 
      console.log("fileForecast:")
      console.log(fileForecast)
    }
  }, [fileForecast]) ;

  useEffect(() => {
    if (flagFCST === true) { 
      console.log("file forecast read")
      console.log(fileForecast)
    }
  }, [fileForecast]) ;
  

  useEffect(() => {
    if (flagFCST === true) {  // only care to run this if flagFCST
      console.log("Actual check of selected")
      console.log(fileForecast)
    } 
  }
  ), [fileForecast]; // KS: why is this loading twice? Can see it logged, It's like it's printing the last one and then this new selection one?

  useEffect(() => {
    if (flagHist === true) { 
      // setSelectedPast(selectedPastET)
      setSelectedPast(convertToGMT(selectedPastET));
    }
  }, [selectedPastET]) ;

  useEffect(() => {
    if (flagHist === true) { 
      setFilePast(datestring_tofilenamestring(prepFileString(selectedPast)));
      console.log("break for hist");
    }
  }, [selectedPast]) ;

  useEffect(() => {
    if (flagHist === true) { 
      console.log("selectedPastET")
      console.log(selectedPastET)
    }
  }, [selectedPastET]) ;

  useEffect(() => {
    if (flagHist === true) { 
      console.log("selectedPast")
      console.log(selectedPast)
    }
  }, [selectedPast]) ;

  useEffect(() => {
    if (flagHist === true) { 
      console.log("filePast")
      console.log(filePast)
    }
  }, [filePast]) ;


  useEffect(() => {
    if (flagHist === true) { 
      console.log("prepped file name for historical past")
      console.log(filePast)
    }
  }, [filePast]) ;


  // Handle date change from DatePçicker
  const handleDateChange = (date) => {
    setSelectedPastET(date);
  };

  // prep the other dir paths for previous and next days in case edge case of camlevel date (like if request is for midnight on 11/10, maybe the closest file is 11:58 on 11/9)
  useEffect(() => {
    if (flagHist === true) { 
      setAdjacentDays(prevday_nextday(selectedPast))
    }
  }, [selectedPast]) ;

  useEffect(() => {
    if (flagHist === true) { 
      setAdjacentDaysLive(prevday_nextday(selectedDateCam));
    }
  }, [selectedDateCam]) ;

  // check that it worked
  useEffect(() => {
    if (flagHist === true) { 
      console.log("adjacent days")
      console.log(adjacentDays)
    }
  }, [adjacentDays]) ;

  useEffect(() => {
    if (flagHist === true) { 
      console.log("selectedPats is updated")
      console.log(selectedPast)
    }
  }, [selectedPast]) ;



  // Handle dropdown for forecast
  const handleForecasetChange = (e) => {
    const userforecast = e.target.value;
    setSelectedForecastET(userforecast); // change user context (see where this is needed)
    // also change subdir
    // maybe better to move these under a useeffect although can do similar things?
  };

  

  // Second: Load in the data

  // Define this function that, when called on (see useEffect later) will load the corresponding data based on user selection
  const fetchData = async (inputcontext, inputlevel, inputfilestring, inputdirsadjacent, inputcamdate) => {
    try {
      // console.log("beginning fetch")
      // // console.log(dictinput)
      // console.log(`${inputcontext}, ${inputlevel}, ${inputfilestring}`)
      // console.log("try sending two params")
      // const p2 = 'cam';
      // // console.log(`/data?param1=${selectedParam1}&param2=${selectedParam2}`)
      // console.log("fetch query for API")
      // console.log(`https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3009/data?param1=${inputcontext}&param2=${inputlevel}&param3=${inputfilestring}`)
      const response = await fetch(`https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3009/data?param1=${inputcontext}&param2=${inputlevel}&param3=${inputfilestring}&param4=${inputdirsadjacent}&param5=${inputcamdate}`, {
        method: 'GET',
        // credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      })
      // .then(async (res)=> await // console.log('res',res.json()));
      // console.log("got through await fetch")
      // // console.log(response.status)

      if (!response.ok) {
        console.error("Failed to fetch data:", response.statusText);
        return;
      }
     
      const apiResponse = await response.json();
      // console.log('API Response:', apiResponse); // Log API response
      // console.log("through here????")

      // console.log('try printing in map when pulling data from api');
      // console.log('JSON Data CAMLEVEL:', apiResponse.data);
      // console.log('TIME OF CAM DATA UPDATE:', apiResponse.time);
      // setData(apiResponse.data); // Update data state
      // setLastUpdateCam(apiResponse.time)
      // need to also return time

      return apiResponse.data

    } catch (error) {
      console.error('API Error:', error.message);
    }
  };
  // Load the data
  // Do this by calling the fetchdata function when selectedDictionary changes (based on user intraction), and do this by using the built in React useEffect feature

  // const runFetch = async () => {
  //   // console.log('Component rendered, fetch should occur');
  //   // console.log('selectedDictionary:', selectedDictionary);
    
  //   const dataloaded_camlevel = await fetchData(selectedDictionary);
  //   setData(dataloaded_camlevel);
  // };

  // clean up eventually bc repetitive code in here and the Forecast map and the Historical map after needed to split up dependecies into multiple pieces
  // useEffect(() => {
  //   console.log("complete resturcture");
  //   // const dataloaded_camlevel = await ;
  //   setData(fetchData(selectedContext, "data_camlevel", "irrelev.js" ,['2024/11/20', '2024/11/21', '2024/11/22'],selectedDateCam));
  //   // const dataloaded_hrrrlevel = await ; //"data_hrrrlevel"
  //   setFCSTData(fetchData(selectedContext, "data_hrrrlevel", fileLiveOrHistHRRR, [], ''));
  // }, []); // dont put flagLive in here! Bc it will render before any of the other stuff does. 
  useEffect(() => {
    console.log("upon initial render");
    console.log(adjacentDaysLive);
    console.log(selectedDateCam);
    const fetchDataAsync_init = async () => {
      try {
        // Fetch and set camlevel data
        const dataloaded_camlevel = await fetchData(
          selectedContext, 
          "data_camlevel",  //"data_camlevel/allonedir", 
          "irrelev.js", 
          adjacentDaysLive, 
          selectedDateCam
        );
        setData(dataloaded_camlevel);
  
        // Fetch and set hrrrlevel data
        const dataloaded_hrrrlevel = await fetchData(
          selectedContext, 
          "data_hrrrlevel", 
          fileLiveOrHistHRRR, 
          [], 
          ''
        );
        setFCSTData(dataloaded_hrrrlevel);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    // Call the async function
    fetchDataAsync_init();
  }, []);

  // comment out to start w cam
  useEffect(() => {
    if (selectedContext == "Live") {
      console.log("upon context change-LIVE");
      const fetchDataAsync_live = async () => {
        try {
          // Fetch and set camlevel data
          const dataloaded_camlevel = await fetchData(
            selectedContext, 
            "data_camlevel",  //"data_camlevel/allonedir", 
            "irrelev.js", 
            adjacentDaysLive, 
            selectedDateCam
          );
          setData(dataloaded_camlevel);
    
          // Fetch and set hrrrlevel data
          const dataloaded_hrrrlevel = await fetchData(
            selectedContext, 
            "data_hrrrlevel", 
            fileLiveOrHistHRRR, 
            [], 
            ''
          );
          setFCSTData(dataloaded_hrrrlevel);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
  
      // Call the async function
      fetchDataAsync_live();
    }
  }, [selectedContext]);


  useEffect(() => {
    if (selectedContext == "Forecast") {
      console.log("upon context change-FCST");
      console.log(fileForecast);
      const fetchDataAsync_fcst = async () => {
        try {
          // dont need cam level at all for fcst
    
          // Fetch and set hrrrlevel data
          const dataloaded_hrrrlevel = await fetchData(
            selectedContext, 
            "data_hrrrlevel", 
            fileForecast, 
            [], 
            ''
          );
          setFCSTData(dataloaded_hrrrlevel);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
      // Call the async function
      fetchDataAsync_fcst();
    }
  }, [fileForecast]); // render if selectedContext changes (specifically if it changes to Forecast, which is taken care of via the if statement inside) and also changes if fileForecast is updated, which is needed if user selectts a different date to see


  useEffect(() => {
    if (selectedContext == "Historical") {
      console.log("upon context change-HIST");
      const fetchDataAsync_hist = async () => {
        try {
          // Fetch and set camlevel data
          const dataloaded_camlevel = await fetchData(
            selectedContext, 
            "data_camlevel", 
            "irrelev.js", 
            adjacentDays, 
            selectedPast
          );
          setData(dataloaded_camlevel);
    
          // Fetch and set hrrrlevel data
          const dataloaded_hrrrlevel = await fetchData(
            selectedContext, 
            "data_hrrrlevel", 
            filePast, 
            [], 
            ''
          );
          setFCSTData(dataloaded_hrrrlevel);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
      // Call the async function
      fetchDataAsync_hist();
    };
  

  }, [filePast]);

  // comment out to start w cam


  useEffect(() => {
    console.log("data")
    console.log(data)
  }, [data]) ;

  useEffect(() => {
    console.log("FCSTdata")
    console.log(FCSTdata)
  }, [FCSTdata]) ;

  // remove with resturcture
  // useEffect(() => {
  //   console.log("entering first useeffect for upon load")

  //   // load camlevel data
  //   // note that the runFetch async function is necessary *inside* this useeffect because we can't use await inside the ueseffect directly (due to synchronous requirement of the useffect hook) but yet we have to wait (async) for the data to load before trying to complete the useffect (o/w it may move on without having data loaded)

  //   const runFetch = async (inputcontext, inputlevel, inputfilestring,inputdirsadjacent, inputcamdate) => {
  //     try {
  //       // console.log('Component rendered, fetch should occur');
  //       // console.log(subdir)
  //       // // console.log('selectedDictionary:', selectedDictionary);
  
  //       const dataloaded_camlevel = await fetchData(inputcontext, inputlevel, inputfilestring,inputdirsadjacent, inputcamdate);
  //       setData(dataloaded_camlevel);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };


  //   const runFetch_hrrrlevel = async (inputcontext, inputlevel, inputfilestring,inputdirsadjacent, inputcamdate) => {
  //     try {
  //       // console.log('Component rendered, fetch should occur');
  //       // console.log(subdir)
  //       // // console.log('selectedDictionary:', selectedDictionary);
  
  //       const dataloaded_hrrrlevel = await fetchData(inputcontext, inputlevel, inputfilestring, inputdirsadjacent, inputcamdate); //"data_hrrrlevel"
  //       setFCSTData(dataloaded_hrrrlevel);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };

  //   // if showing current conditions, load cam level data and/or hrrr level data depending on user input
  //   if (selectedContext == "Live") {
  //     console.log("entering live")
  //     console.log(selectedContext, )
  //     // console.log("entering live?????")
  //     if (showdots){
  //       // const cams_dir = "data_camlevel";
  //       // console.log("TRY TO PRINT IN LOADING USEEFFECT")
  //       // setDirLevel("data_camlevel")
  //       // // console.log(selectedContext, dirLevel)
  //       runFetch(selectedContext, "data_camlevel", "irrelev.js" ,['2024/11/20', '2024/11/21', '2024/11/22'],selectedDateCam );
  //       // hardcode to chec for now before getting useeffect dependencies to work... 
  //       // console.log("print data inside load if")
  //       // console.log(data)

  //     }
  //     if (showFCST){
  //       // console.log("entering show fcst???")
  //       // setDirLevel("data_hrrrlevel")
  //       // console.log(selectedContext, "data_hrrrlevel", fileLiveOrHistHRRR)
  //       runFetch_hrrrlevel(selectedContext, "data_hrrrlevel", fileLiveOrHistHRRR, [], '')

  //     }
  //   }
  // }, []); // dont put flagLive in here! Bc it will render before any of the other stuff does. 


  // // comment out these fcst or hist useeffects to debug
  // useEffect(() => {
  //   console.log("entering second useeffect for forecast")

  //   // load camlevel data
  //   // note that the runFetch async function is necessary *inside* this useeffect because we can't use await inside the ueseffect directly (due to synchronous requirement of the useffect hook) but yet we have to wait (async) for the data to load before trying to complete the useffect (o/w it may move on without having data loaded)


  //   const runFetch_hrrrlevel = async (inputcontext, inputlevel, inputfilestring, inputdirsadjacent, inputcamdate) => {
  //     try {
  //       // console.log('Component rendered, fetch should occur');
  //       // console.log(subdir)
  //       // // console.log('selectedDictionary:', selectedDictionary);
  
  //       const dataloaded_hrrrlevel = await fetchData(inputcontext, inputlevel, inputfilestring,inputdirsadjacent, inputcamdate); //"data_hrrrlevel"
  //       setFCSTData(dataloaded_hrrrlevel);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };

  //   // if showing current conditions, load cam level data and/or hrrr level data depending on user input
  //   if (selectedContext == "Forecast"){
  //     console.log("entered forecast")
  //     console.log(selectedContext)
  //     console.log(fileForecast)
  //     runFetch_hrrrlevel(selectedContext, "data_hrrrlevel", fileForecast, [], '')
  //     // to test out issue plug in a fileForecast string there
  //   }
  // }, [flagFCST]); //fileForecast


  // useEffect(() => {
  //   console.log("entering third useeffect for historicl")
  //   console.log(selectContext)
  //   console.log(filePast)

  //   // load camlevel data
  //   // note that the runFetch async function is necessary *inside* this useeffect because we can't use await inside the ueseffect directly (due to synchronous requirement of the useffect hook) but yet we have to wait (async) for the data to load before trying to complete the useffect (o/w it may move on without having data loaded)

  //   const runFetch = async (inputcontext, inputlevel, inputfilestring,inputdirsadjacent, inputcamdate) => {
  //     try {
  //       // console.log('Component rendered, fetch should occur');
  //       // console.log(subdir)
  //       // // console.log('selectedDictionary:', selectedDictionary);
  
  //       const dataloaded_camlevel = await fetchData(inputcontext, inputlevel, inputfilestring,inputdirsadjacent, inputcamdate);
  //       setData(dataloaded_camlevel);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };


  //   const runFetch_hrrrlevel = async (inputcontext, inputlevel, inputfilestring,inputdirsadjacent, inputcamdate) => {
  //     try {
  //       // console.log('Component rendered, fetch should occur');
  //       // console.log(subdir)
  //       // // console.log('selectedDictionary:', selectedDictionary);
  
  //       const dataloaded_hrrrlevel = await fetchData(inputcontext, inputlevel, inputfilestring,inputdirsadjacent, inputcamdate); //"data_hrrrlevel"
  //       setFCSTData(dataloaded_hrrrlevel);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };

  //   // if showing current conditions, load cam level data and/or hrrr level data depending on user input
  //   if (selectedContext == "Historical"){
  //     // console.log("entered forecast")
  // //     runFetch_hrrrlevel(selectedContext, "data_hrrrlevel", filePast)
  // // }

  //     if (showdots){
  //       // const cams_dir = "data_camlevel";
  //       // console.log("TRY TO PRINT IN LOADING USEEFFECT")
  //       // setDirLevel("data_camlevel")
  //       // // console.log(selectedContext, dirLevel)
  //       runFetch(selectedContext, "data_camlevel", "irrelev.js", adjacentDays,selectedPast);
  //       // console.log("print data inside load if")
  //       // console.log(data)

  //     }
  //     if (showFCST){
  //       // console.log("entering show fcst???")
  //       // setDirLevel("data_hrrrlevel")
  //       // console.log(selectedContext, "data_hrrrlevel", fileLiveOrHistHRRR)
  //       runFetch_hrrrlevel(selectedContext, "data_hrrrlevel", filePast, [],'' )

  //     }
  //   }
  // }, [flagHist]); //filePast

  // end comment out 11/21


  // be careful with lots of dependencies; what is happening is that if ONE changes, it will re-render the whole thing, which may not do what you want it to if that one thing needs to render some other things first. Had an issue with forecast here bc flagFCST changed so it re-rendered the whole thing but fileForecast wasnt rendered yet

  // console.log("updated new way with dictname input!")
    
  // remove 1116
  // useEffect(() => {
  //   // same as above but for hrrrlevel; see notes useffect above
  //   const runFetch = async () => {
  //     try {
  //       // console.log('Component rendered, fetch should occur');
  //       // console.log(subdir)
  //       // console.log('selectedFCSTDictionary:', selectedFCSTDictionary);
  
  //       const dataloaded_hrrrlevel = await fetchData(subdir, selectedFCSTDictionary);
  //       setFCSTData(dataloaded_hrrrlevel);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };
  
  //   runFetch();
  // }, [selectedFCSTDictionary]);

  // console.log("updated new way with dictname input on FCST!!")


  
  // Third: plot the map. Make two helper functions to break up the code from useEffect (1, the map basics and 2, the plotted RSC points)

  // Define helper function to set up the map basics, Later, will be called on in useEffect later when data changes, which relies on when user changes dictionary. 
  
  const setupMap = (container, state) => {
    const map = new mapboxgl.Map({
      container: container,
      style: 'mapbox://styles/mapbox/light-v9',
      attributionControl: false,
      center: [state.lng, state.lat],
      zoom: state.zoom,
    }); // built in mapbox function to make it
  
    // Add navigation control
    map.addControl(new mapboxgl.NavigationControl());
  
    // Add roadways layer
    map.on('load', () => {
      map.addLayer({
        'id': 'roadways',
        'type': 'line',
        'source': 'composite',
        'source-layer': 'road',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#888',
          'line-width': 1
        }
      });
    });
  
    return map;
  };
  
  // Initialize the map only once
  useEffect(() => {
    const map = setupMap(mapContainer.current, state);
    map.on('load', () => {
      setMapInstance(map); // Store the initialized map instance
    });

    return () => map.remove(); // Cleanup the map when the component unmounts
  }, []); // Empty dependency array to ensure this only runs once on mount

  // Define helper functions to plot fcst color gradients
  // first helper function will convert the dataFCST dictionary to GeoJSON format for easy Map plotting
  const convertDataToGeoJSON = (datatoconvert) => {
    return {
      type: 'FeatureCollection',
      features: Object.entries(datatoconvert).map(([key, properties]) => {
        const [lat, lon] = key.split('_').map(Number);
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lon, lat] // Mapbox expects [lon, lat]
          },
          properties: {
            color: properties.color || "#000000" // Default color if missing
          }
        };
      })
    };
  };



  const parseLatLon = (latLonStr) => {
    const [lat, lon] = latLonStr.split('_');
    return [parseFloat(lat), parseFloat(lon)];
  };

  const convertDataToDots = (data) => {
    return Object.keys(data).map((key) => {
      const [lat, lon] = parseLatLon(key);
      // const [lat, lon] = key.split(',');
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        properties: {
          color: data[key].color,
        },
      };
    });
  };
    
  // Make the boolean oobject (from user-selected conditions) into an array for filtering data
  const makeArray = (inputBoolDict) => {
    const boolArray = Object.keys(inputBoolDict).filter(
    (condition) => inputBoolDict[condition] === true
    )
    return boolArray
  };

  // Helper function to filter data based on selected conditions
  const filterDataByConditions = (data, selectedConditions) => {
    return Object.fromEntries(
      Object.entries(data).filter(
        ([, value]) => selectedConditions.includes(value.final_model_pred)
      )
    );
  };

  // Helper function to reorder data based on condition priority
  const reorderDataByPriority = (filteredData, conditionOrder) => {
    const sortedArray = Object.entries(filteredData).sort(
      ([, a], [, b]) =>
        conditionOrder.indexOf(a.final_model_pred) -
        conditionOrder.indexOf(b.final_model_pred)
    );

    return Object.fromEntries(sortedArray);
  };


  // this builds the map
  useEffect(() => {
    if (!mapInstance) return; // Ensure mapInstance is ready

    // Convert FCSTdata to GeoJSON
    const geoJSONData = convertDataToGeoJSON(FCSTdata);
  

    // **1. Manage forecast gradient (FCST) source and layer**
    if (showFCST) {
      if (mapInstance.getSource('points')) {
        // Update the data if the source already exists
        mapInstance.getSource('points').setData(geoJSONData);
      } else {
        // Create the source and layer if they don't exist
        mapInstance.addSource('points', {
          type: 'geojson',
          data: geoJSONData,
        });

        mapInstance.addLayer({
          id: 'point-layer',
          type: 'circle',
          source: 'points',
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': 30,
            'circle-opacity': [
              'interpolate', 
              ['linear'],
              ['zoom'],
              7, 0.025,
              12,.9
            ],
            'circle-blur': 1,
          },
        });
      }
    } else {
      // Remove the FCST layer if it exists and showFCST is false
      if (mapInstance.getLayer('point-layer')) {
        mapInstance.removeLayer('point-layer');
      } // point-layer here!
      if (mapInstance.getSource('points')) {
        mapInstance.removeSource('points');
      }
    }
      

    // 2 manage adding cam level dots

    // console.log("check what is data")
    // console.log(data)

    // convert into array of conditions 
    const conditionsArray = makeArray(conditions)

    // console.log("check what is conditions (these are user-selected")
    // console.log(conditions)
    // Filter and order the data
    // Step 1: Filter the data based on selected conditions
    const filteredData = filterDataByConditions(data, conditionsArray);

    // Step 2: Reorder the filtered data based on the specified priority
    const orderedData = reorderDataByPriority(filteredData,["obs","poor_viz", , "dry", "wet", "snow","snow_severe"]);

    // const filteredData = filterDataByConditions(data, conditions);
    // const orderedData = orderDataByPriority(filteredData, ["snow_severe", "snow", "wet", "dry", "poor_viz", "obs"]);
    

    const dotsData = convertDataToDots(orderedData); //data


    if (showdots) {
      // console.log("DOTS DATA!!")
      // console.log(dotsData)

      if (mapInstance.getSource('dots')) {
        mapInstance.getSource('dots').setData({
          type: 'FeatureCollection',
          features: dotsData,
        });
      } else {
        mapInstance.addSource('dots', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: dotsData,
          },
        });
    
        mapInstance.addLayer({
          id: 'dots-layer',
          type: 'circle',
          source: 'dots',
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': 5, // Adjust radius as needed
            'circle-opacity': 1, // Adjust opacity as needed
          },
          // Ensure dots are on top of other layers
          'before': 'fill-layer', // Adjust index as needed
        });
      }
    // Check if the layers have been added in the correct order
    const layers = mapInstance.getStyle().layers;
    const fcstLayerIndex = layers.findIndex(layer => layer.id === 'point-layer'); // point-layer here!
    const dotsLayerIndex = layers.findIndex(layer => layer.id === 'dots-layer');

    // If the dots layer is below the FCST layer, we move it above
    if (dotsLayerIndex < fcstLayerIndex) {
      mapInstance.moveLayer( 'point-layer','dots-layer'); //point-layer first one here
    }
    
  }


  // Cleanup function
  return () => {
    if (mapInstance) {
      if (mapInstance.getLayer('point-layer')) { //'point-layer'
        mapInstance.removeLayer('point-layer'); //'point-layer'
      }
      if (mapInstance.getSource('points')) {
        mapInstance.removeSource('points');
      }
      if (mapInstance.getLayer('dots-layer')) {
        mapInstance.removeLayer('dots-layer');
      }
      if (mapInstance.getSource('dots')) {
        mapInstance.removeSource('dots');
      }
    }
  };
  }, [mapInstance, FCSTdata, camdata, data, conditions, showdots, showFCST]); // Re-run when any of these data dependencies change

  // // console.log("log selectedDictionar")
  // // console.log(selectedDictionary)
  // console.log("log conditions")
  // console.log(conditions)

  return (

    <div style={{ marginTop: '0px', padding: '0px' }}>
      <h1 style={{ margin:'0',paddingBottom: '0px'}}>Road surface condition detection</h1>
      <p style={{ fontSize: '18px', fontStyle: 'italic' ,margin: '0', paddingTop: '0px', paddingBottom: '20px'}} >Detected by machine-learning models</p>
      {/* <h2>{`${getTitle()}`}</h2> */}
      {/* <h3>{`Updated at:`}</h3> */}
      {/* <h3>{`Colo`}</h3> */}
      {/* <label>
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
        />
        Enable Auto Refresh
      </label> */}

    

      <h2 style={{ margin: '0'}}> Choose the time to display <Tooltip content="Select whether to display current conditions (present/live), forecasted conditions (future), or historical conditions (from past events). The current conditions representthe real-time perspective with the most recently updated data, which is relevent for an up-to-date picture of the road surface conditions. The forecasted conditions represent future conditions, for which there are are no camera images to make predictions at the NYSDOT camera level. The Historical data option is to view past data, viewing the conditions from a case study perspective, which uses archived data." /></h2>
      {/* <p> Choose whether to display </p> */}
      {/* <p style={{ margin: '0', paddingTop: '10px', paddingLeft: '20px'}}>Display live data </p>
      <p style={{ marginTop: '0', marginBottom: '10px'}}>Display historical data (SELECT DATE) </p> */}
      <div style={{
        paddingLeft: '10px',  // Left padding
        // paddingRight: '10px',  // Right padding (optional)
        paddingTop: '5px',  // Top padding (optional)
        paddingBottom: '5px',  // Bottom padding (optional)
      }}>
        
        {/* First dropdown: Live or Historical */}
        <select 
          value={selectedContext} 
          onChange={handleContextChange}
          style={{
            fontSize: '18px',  // Adjust font size
            // fontWeight: 'bold',  // Optional: Bold font
            // paddingTop: '10px',
            // paddingLeft: '10px',
            padding: '0.5px',  // Optional: Increase padding
          }}
        >
          <option value="Live">Current (present)</option>
          <option value="Forecast">Forecast (future)</option>
          <option value="Historical">Historical (past)</option>
        </select>

        {/* Conditional rendering for datetime picker */}
        {selectedContext === 'Historical' && (
          <div style = {{paddingTop: '20px',paddingLeft: '20px', overflow:'visible', width: '100%'  }}>
            <p style={{ margin: '0', padding: '0px',marginBottom: '3px' , marginLeft: '0px',textDecoration: 'underline'}}> Past Date and Time: </p>
            <label> Select from calendar: </label>
            <DatePicker
              style = {{marginLeft: '100px'}}
              // popperModifiers={{
              //   preventOverflow: { enabled: false }  // Disable overflow prevention
              // }}
              selected={selectedPastET}
              onChange={handleDateChange}
              showTimeSelect
              timeIntervals={60} // Time increments of 5 minutes
              minDate={new Date('2024-01-01T00:00:00')} // Start date: Jan 1st, 2024
              dateFormat="Pp" // Date format: MM/DD/YYYY HH:MM
              timeCaption="Time"
              timeFormat="HH:mm"
            />
          </div>
        )}
        {['Live', 'Historical'].includes(selectedContext) && (
          <div >
            <p style={{ margin: '0', paddingTop: '15px', paddingLeft: '20px', textDecoration: 'underline'}}> Location detail: </p>
            <p style={{ margin: '0', paddingTop: '5px', paddingLeft: '20px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={showdots}
                  onChange={(e) => setShowdots(e.target.checked)}
                  style={{ transform: 'scale(1)' }}
                />
                Show at NYSDOT Camera Locations (colored dots)
                <Tooltip content="Data is refreshed every 5 minutes. This option shows model-predicted road surface condition data for locations where there are camera images. Weather data is also incorporated." />
              </label>
            </p>
         
            <p style={{ margin: '0', paddingTop: '5px', paddingLeft: '20px'}}>
            {/* <h4>{`Last updated at ${lastUpdateCam}`}</h3> */}
              <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={showFCST}
                    onChange={(e) => setShowFCST(e.target.checked)}
                    // style={{ marginLeft: '5px' }}
                    style={{ transform: 'scale(1)' }}
                  />
                  Show at All locations (shading)
                  <Tooltip content="Data is refreshed at the top of the hour. This option shows model-predicted road surface condition data for all geographic locations based on weather data only, no camera image." />
                  {/* Show FCST Data  */}
                  {/*  uncomment above ^ to add checkbox name */}
                </label>
            </p>
          </div>

        )}

        {/* Conditional rendering for forecast selection */}
        {selectedContext === 'Forecast' && (
          <div style = {{ marginLeft: '20px', padding: '0px', paddingTop: '10px'}}>
            <p style={{ margin: '0', padding: '0px',marginBottom: '3px' , marginLeft: '0px',textDecoration: 'underline'}}> Forecast Time: </p>
            <label>Select from dropdown: </label> 
            <select value={selectedForecastET} onChange={handleForecasetChange} style = {{}} >
                {forecastOptions.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </select>
          </div>
        )}

      </div>

      <div id="color-key">
        <p style={{ margin: '0', paddingTop: '10px', paddingLeft: '30px',textDecoration: 'underline'}}> Conditions shown: </p>
        
        <ul style={{ listStyleType: 'none', paddingLeft: '25px' , paddingTop: '0px', marginTop: '5px'}}>
          <li style={{ marginBottom: '5px',marginTop:'0px', paddingLeft:'5px' }}>
            <input
              type="checkbox"
              name="snow_severe"
              checked={conditions.snow_severe}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'red', padding: '3px', color: 'white', borderRadius: '5px' }}>
              Severe snow
            </span>
          </li>
          <li style={{ marginBottom: '5px' , paddingLeft:'5px'}}>
            <input
              type="checkbox"
              name="snow"
              checked={conditions.snow}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'palevioletred', padding: '3px', color: 'white', borderRadius: '5px' }}>
              Snow
            </span>
          </li>
          <li style={{ marginBottom: '5px', paddingLeft:'5px' }}>
            <input
              type="checkbox"
              name="wet"
              checked={conditions.wet}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'dodgerblue', padding: '3px', color: 'white', borderRadius: '5px' }}>
              Wet
            </span>
          </li>
          <li style={{ marginBottom: '5px' , paddingLeft:'5px'}}>
            <input
              type="checkbox"
              name="dry"
              checked={conditions.dry}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'green', padding: '3px', color: 'white', borderRadius: '5px' }}>
              Dry
            </span>
          </li>
          <li style={{ marginBottom: '5px', paddingLeft:'5px' }}>
            <input
              type="checkbox"
              name="poor_viz"
              checked={conditions.poor_viz}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'lightgray', color: 'black', padding: '3px', borderRadius: '5px' }}>
              Poor visibility
            </span>
          </li>
          {showdots && (
            <li style={{ marginBottom: '5px' , paddingLeft:'5px'}}>
              <input
                type="checkbox"
                name="obs"
                checked={conditions.obs}
                onChange={handleConditionChange}
              />
              <span style={{ backgroundColor: 'black', color: 'lightgray', padding: '3px', borderRadius: '5px' }}>
                Obstructed camera
              </span>
            </li>
          )}


        </ul>
      </div>
      <h2 style={{ margin: '0', padding: '0'}}>{`Displaying ${getTitle()}`}</h2>
      
      <div
        ref={mapContainer}
        style={{
          width: '70vw',
          height: '75vh',
          position: 'relative',
        }}
      >
        {/* <div id="color-key">
        <ColorKey />
      </div> */}
        {/* Map will render here */}
      </div>


      {/*  */}
      <div id="mapContainer" style={{ width: '100%', height: '400px' }}></div>

    
    </div>
  );

};

export default Map;