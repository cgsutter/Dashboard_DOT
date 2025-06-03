// import * as React from 'react'; // pushing small change from clean git pull into dashboard_csutter
import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Tooltip from './Tooltip'; // Import the Tooltip component
import {convertToGMT} from './timing_helper.js';
import {prepDateString} from './timing_helper.js';
import {prepListForecastOptions} from './timing_helper.js';
import {prepFileString_live} from './timing_helper.js';
import {prepFileString_fcst} from './timing_helper.js';
import {prep_tofilenamestring} from './timing_helper.js';
import {prevday_nextday} from './timing_helper.js';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";  // 
// import CircularProgress from '@material-ui/core/CircularProgress';


import { api_token_mapbox } from '../credentials.js';
// const token = MY_CONSTANT 
mapboxgl.accessToken = api_token_mapbox;


// This Map component is called on in App.js. Inputs are props (state) which is macro map details, like centered lat/lon and zoom. 
// Map component is re-rendered any time props change or state variables change
const Map = (props) => {
  const mapContainer = useRef(null);
  const { state } = props; 
  // const [autoUpdate, setAutoUpdate] = useState(false); // Track if auto-update is enabled
  const [data, setData] = useState({}); // Based on the selectedDictionary, load the corresponding data using the API and store it in data
  const [FCSTdata, setFCSTData] = useState({}); // equivalent of the above but for fcst data

  const [mapInstance, setMapInstance] = useState(null);
  const [lastUpdateCam, setLastUpdateCam] = useState(null);
  const [lastUpdateFCST, setLastUpdateFCST] = useState(null);

  // State variables below are for user-selected states (dynamic based on their interation w UI), and then those needed for input to fetch API data
  const [showdots, setShowdots] = useState(true); // Toggle for FCST data
  const [showFCST, setShowFCST] = useState(true); // Toggle for FCST data

  const [selectedContext, setSelectedContext] = useState('Live'); // "Live" or "Forecast" or "Historical" XXUSERACTION
  // these are used so that code runs in order that we need. For example, if selectContext changes, we need to do a set of thing (date, filename, etc) BEFORE we try to read in the data and load the map, so by having these flags change after selectedContext change, can use these flags as the dependency for loading data (data fetch). o/w, if just rely on selectContext change for fetching data, react may try to fetch data prior to setting filename, etc (which we need for proper loading!)
  // const [flagLive, setFlagLive] = useState(true); // may need this if user goes back to live context -- check this
  const [flagFCST, setFlagFCST] = useState(false);
  const [flagHist, setFlagHist] = useState(false);
  // Need to set initial values so that the map loads correctly under the initialization of Live. By default in React, these initial state variables are set sequentially. We need them to be dynamic based on the time that the site is loaded, but they still need initial values. Without having in initial values (for example, if we wait for a useEffect to load based on the setDate state), the initial site load won't load. So we need the initial values to be functions (dynamic) of the current time, we need the initialized states to depend on selectedDate, as done below, and it works sequentially as needed. Note that we *also* have these setState functions evaluated in a useEffect to account for the case that the user clicks Forecast or Historical, and then *goes back* to Live.
  const [selectedDateCamET, setSelectedDateCamET] = useState(new Date());  // XXX1 XXUSERACTION
  const [selectedDateCam, setSelectedDateCam] = useState(convertToGMT(selectedDateCamET));//XXX2 XXinputFetchCam
  const [adjacentDaysLive, setAdjacentDaysLive]= useState(prevday_nextday(selectedDateCam));//XXX3 XXinputFetchCam
  const [adjacentDaysHist, setAdjacentDaysHist] = useState([]); //XXX 3-B XXinputFetchCam
  const [selectedDateET, setSelectedDateET] = useState(new Date());  //XXX4 XXUSERACTION
  const [fileLiveHRRR, setfileLiveHRRR] =  useState(prepFileString_live(new Date())); //XXX8 XXinputFetchHRRR
  // When setContext changes, these other state variables are dynamically loaded. They dont affect initial load bc we default to "Live" initially
  const [forecastOptions, setForecastOptions] = useState([]); //XXX10
  const [selectedForecastET, setSelectedForecastET] = useState(''); //XXX11 XXUSERACTION based on user selection from dropdown. The remaining steps parse out time strings and create hrrr file name to request selected forecast which is a string (which will need to then prepare the filename, see below)
  const [fileForecast, setFileForecast] = useState(''); //XXX14  XXinputFetchHRRR
  const [selectedPastET, setSelectedPastET] = useState(''); //XXX 1-B for cam-level and 11-B for hrrr-level (historical equivalent to forecast) XXUSERACTION
  const [selectedPast, setSelectedPast] = useState(''); //XXX 2-B XXinputFetchCam
  const [filePast, setFilePast] = useState(''); //XXX14-B XXinputFetchHRRR
  const popupRef = useRef(null); // Store the popup instance

  const [conditions, setConditions] = useState({
    snow_severe: true,
    snow: true,
    wet: true,
    dry: true,
    poor_viz: true,
    obs: true,
  });


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

  // Handle date change from DatePicker for historical 
  const handleDateChange = (date) => {
    setSelectedPastET(date);
  };

  // anytime the user-defined context changes (Live, Forecast, Historical) state variables should be updated accordingly -- e.g. 1) flags to display dots and/or forecast 2) if Live grab the current time (of refresh) and prepare inputs for fetching cam-level and hrrr-level inputs for Live display. 3) if Forecast, grab the current time which is used to populate dropdown list for user to then select the fcst of interest. 4) if Historical, display a calendar for user to select past date/time. 
  useEffect(() => {
    if (selectedContext === "Live") { 
      // set the subdir for the API to search for the most recent file for camlevel
      // set the current datetime for the API to search for the best hrrr-level data. Note that upon loading, the default will use the current time, but need this in here in case the user switches from live, to historical, and then back to live (need to reset it to current time)
      setSelectedDateCamET(new Date());
      setSelectedDateCam(convertToGMT(selectedDateCamET));
      setAdjacentDaysLive(prevday_nextday(selectedDateCam));
      console.log("break 1 A");

      setSelectedDateET(new Date());

      console.log("break 1 B");
      setShowdots(true);
      setShowFCST(true);
      console.log("break 1 C");

      console.log("break 1 D");

      console.log("break 1 E");

      console.log("break 1 F");

      setfileLiveHRRR(prepFileString_live(selectedDateET));
      console.log("break 1 G");
      // in case user switches from Live to fcst to back to Live, for example
      setFlagFCST(false);
      setFlagHist(false);


    } else if (selectedContext === "Historical") { // if the user selects historical or forecast, they will select the datetime they want and it will be set that way
      console.log("break 3 A")
      setShowdots(true);
      setShowFCST(true);
      console.log("break 3 B")
      // setFlagLive(false);
      setFlagFCST(false);
      setFlagHist(true);
      console.log("break 3 C")
    } else if (selectedContext === "Forecast") {
      console.log("break 2 A");
      setShowdots(false);
      setShowFCST(true);
      console.log("break 2 B");
      // setFlagLive(false);
      setFlagFCST(true);
      setFlagHist(false);
      console.log("break 2 C");
      setSelectedDateET(new Date());
      console.log("break 2 E");
      setForecastOptions(prepListForecastOptions(selectedDateET)); 
      // console.log(forecastOptions)
      console.log("break 2 F");
    }
  }, [selectedContext]); 


  useEffect (() => {
    console.log("selectedDateET:")
    console.log(selectedDateET)
  }, [selectedDateET]);


  useEffect (() => {
    console.log("fileLiveHRRR:")
    console.log(fileLiveHRRR)
  }, [fileLiveHRRR]); 
        
  // useEffect (() => {
  //   console.log("selectedDate:")
  //   console.log(selectedDate)
  // }, [selectedDate]); 

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

      console.log("auto initially select the first forecast option (before user has a chance to select a different one), to the first value")
      setSelectedForecastET(forecastOptions[0]);
    }
  }, [forecastOptions]) ;

  useEffect (() => {
    console.log("selectedForecastET:")
    console.log(selectedForecastET)
  }, [selectedForecastET]); 


  // Handle dropdown for forecast
  const handleForecasetChange = (e) => {
    const userforecast = e.target.value;
    setSelectedForecastET(userforecast); // change user context (see where this is needed)
    // also change subdir
    // maybe better to move these under a useeffect although can do similar things?
  };





  useEffect(() => {
    if (flagFCST === true) { 
      setFileForecast(prepFileString_fcst(selectedForecastET))

    }
  }, [selectedForecastET]) ;



  useEffect(() => {
    if (flagFCST === true) { 
      console.log("fileForecast:")
      console.log(fileForecast)
    }
  }, [fileForecast]) ;


  useEffect(() => {
    if (flagHist === true) { 
      // setSelectedPast(selectedPastET)
      setSelectedPast(convertToGMT(selectedPastET));
    }
  }, [selectedPastET]) ;

  useEffect(() => {
    if (flagHist === true) { 
      setFilePast(prep_tofilenamestring(prepDateString(selectedPast)));
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

  // hereee
  useEffect(() => {
    console.log("CAM UPDATE TIME RECEIVED:")
    console.log(lastUpdateCam)
  }, [lastUpdateCam]) ;

  useEffect(() => {
    console.log("FORECAST UPDATE TIME RECEIVED:")
    console.log(lastUpdateFCST)
  }, [lastUpdateFCST]) ;

  // prep the other dir paths for previous and next days in case edge case of camlevel date (like if request is for midnight on 11/10, maybe the closest file is 11:58 on 11/9)
  useEffect(() => {
    if (flagHist === true) { 
      setAdjacentDaysHist(prevday_nextday(selectedPast))
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
      console.log("adjacent days Hist")
      console.log(adjacentDaysHist)
    }
  }, [adjacentDaysHist]) ;

  useEffect(() => {
    if (flagHist === true) { 
      console.log("selectedPats is updated")
      console.log(selectedPast)
    }
  }, [selectedPast]) ;



  // Second: Load in the data

  // Define helper function to fect data from API. When called on (see useEffect later) will load the corresponding data based on user selection
  const fetchData = async (inputcontext, inputlevel, inputfilestring, inputdirsadjacent, inputcamdate, inputimgpath) => {
    try {

      const response = await fetch(`https://xcitelab.org/dot-api?param1=${inputcontext}&param2=${inputlevel}&param3=${inputfilestring}&param4=${inputdirsadjacent}&param5=${inputcamdate}&param6=${inputimgpath}`, {
        method: 'GET',
        // credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error("Failed to fetch data:", response.statusText);
        return;
      }
     
      const apiResponse = await response.json();

      return {
        data: apiResponse.data, // Assuming `data` is part of the API response
        time: apiResponse.time  // Assuming `time` is part of the API response
      };

    } catch (error) {
      console.error('API Error:', error.message);
    }
  };

  // Load the data
  // Do this by calling the fetchdata function when selectedDictionary changes (based on user intraction), and do this by using the built in React useEffect feature

  useEffect(() => {
    console.log("upon initial render");
    console.log(adjacentDaysLive);
    console.log(selectedDateCam);
    const fetchDataAsync_init = async () => {
      try {
        // Fetch and set camlevel data
        const resultfetch = await fetchData(
          selectedContext, 
          "data_camlevel",  //"data_camlevel/allonedir", 
          "irrelev.js", 
          adjacentDaysLive, 
          selectedDateCam,
          "",
        );

        // this is where the main data from API fetch is pulled in
        setData(resultfetch.data); // the dictionary of model information from the file of interest pulled is in .data
        setLastUpdateCam(resultfetchHRRR.time); // the selected file time from the file of interest pulled is in .time
  
        // Fetch and set hrrrlevel data
        const resultfetchHRRR = await fetchData(
          selectedContext, 
          "data_hrrrlevel", 
          fileLiveHRRR, 
          [], 
          '',
          ""
        );

        // this is where the main data from API fetch is pulled in
        setFCSTData(resultfetchHRRR.data); // // the dictionary of model information from the file of interest pulled is in .data
        setLastUpdateFCST(resultfetchHRRR.time); // the selected file time from the file of interest pulled is in .time

        console.log(lastUpdateFCST)
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
      console.log(selectedContext, "data_camlevel", "irrelev.js", adjacentDaysLive, selectedDateCam)
      
      const fetchDataAsync_live = async () => {
        try {
          // Fetch and set camlevel data
          const resultfetch2 = await fetchData(
            selectedContext, 
            "data_camlevel",  //"data_camlevel/allonedir", 
            "irrelev.js", 
            adjacentDaysLive, 
            selectedDateCam,
            ""
          );
          // const dataloaded_camlevel = resultfetch.data;   // Access the data
          // const hrrrUpdateTime = resultfetch.time;
          setData(resultfetch2.data);
          setLastUpdateCam(resultfetch2.time);

    
          // Fetch and set hrrrlevel data
          console.log(selectedContext, "data_hrrrlevel", fileLiveHRRR, [], '')
          const resultfetchHRRR2 = await fetchData(
            selectedContext, 
            "data_hrrrlevel", 
            fileLiveHRRR, 
            [], 
            '',
            ""
          );
          // const dataloaded_hrrrlevel = resultfetch.data;   // Access the data
          // const hrrrUpdateTime = resultfetch.time;
  
          setFCSTData(resultfetchHRRR2.data);
          setLastUpdateFCST(resultfetchHRRR2.time);

          console.log()

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
          const resultfetchHRRR3 = await fetchData(
            selectedContext, 
            "data_hrrrlevel", 
            fileForecast, 
            [], 
            '',
            ""
          );
          setFCSTData(resultfetchHRRR3.data);
          setLastUpdateFCST(resultfetchHRRR3.time);
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
          const resultfetch4 = await fetchData(
            selectedContext, 
            "data_camlevel", 
            "irrelev.js", 
            adjacentDaysHist, 
            selectedPast,
            ""
          );
          setData(resultfetch4.data);
          setLastUpdateCam(resultfetch4.time);
    
          // Fetch and set hrrrlevel data
          const resultfetchHRRR4 = await fetchData(
            selectedContext, 
            "data_hrrrlevel", 
            filePast, 
            [], 
            '',
            ""
          );
          setFCSTData(resultfetchHRRR4.data);
          setLastUpdateFCST(resultfetchHRRR4.time);
          console.log("FILE BEING FETCHED FROM MAP.JS")
          console.log(filePast);
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
  // this is where the lat and lon and model output data (in properties) are parsed out before adding to map

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
            color: properties.color || "#000000", // Default color if missing
            confidence: properties.confidence || "N/A", // Add another property with a default value
            modelpred: properties.final_model_pred || "N/A"

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
          confidence: data[key].confidence || "N/A", // Add another property with a default value
          modelpred: data[key].final_model_pred || "N/A",
          imagePath: data[key].img_model || "N/A"
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
    if (!mapInstance) return;
  
    const conditionsArray = makeArray(conditions);
  
    // Process forecast data
    const filteredData_hrrr = filterDataByConditions(FCSTdata, conditionsArray);
    const orderedData_hrrr = reorderDataByPriority(filteredData_hrrr, ["poor_viz", "dry", "wet", "snow", "snow_severe"]);
    const geoJSONData = convertDataToGeoJSON(orderedData_hrrr);
  
    // Process cam data
    const filteredData = filterDataByConditions(data, conditionsArray);
    const orderedData = reorderDataByPriority(filteredData, ["obs", "poor_viz", "dry", "wet", "snow", "snow_severe"]);
    const dotsData = convertDataToDots(orderedData);
  
    // Manage FCST layer
    if (showFCST) {
      if (mapInstance.getSource('points')) {
        mapInstance.getSource('points').setData(geoJSONData);
      } else {
        mapInstance.addSource('points', { type: 'geojson', data: geoJSONData });
        mapInstance.addLayer({
          id: 'point-layer',
          type: 'circle',
          source: 'points',
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 10, 12, 70],
            'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.08, 9, 0.1, 10, 0.2, 12, 0.3],
            'circle-blur': 0.5,
          },
        });
      }
    } else {
      if (mapInstance.getLayer('point-layer')) mapInstance.removeLayer('point-layer');
      if (mapInstance.getSource('points')) mapInstance.removeSource('points');
    }
  
    // Manage cam dots layer
    if (showdots) {
      if (mapInstance.getSource('dots')) {
        mapInstance.getSource('dots').setData({ type: 'FeatureCollection', features: dotsData });
      } else {
        mapInstance.addSource('dots', { type: 'geojson', data: { type: 'FeatureCollection', features: dotsData } });
        mapInstance.addLayer({
          id: 'dots-layer',
          type: 'circle',
          source: 'dots',
          paint: { 'circle-color': ['get', 'color'], 'circle-radius': 5, 'circle-opacity': 1 },
        });
      }
    } else {
      if (mapInstance.getLayer('dots-layer')) mapInstance.removeLayer('dots-layer');
      if (mapInstance.getSource('dots')) mapInstance.removeSource('dots');
    }
  
    // Ensure layers are in the correct order
    const layers = mapInstance.getStyle().layers;
    const fcstLayerIndex = layers.findIndex(layer => layer.id === 'point-layer');
    const dotsLayerIndex = layers.findIndex(layer => layer.id === 'dots-layer');
    if (dotsLayerIndex < fcstLayerIndex) {
      mapInstance.moveLayer('point-layer', 'dots-layer');
    }
  
    return () => {
      if (mapInstance) {
        if (mapInstance.getLayer('point-layer')) mapInstance.removeLayer('point-layer');
        if (mapInstance.getSource('points')) mapInstance.removeSource('points');
        if (mapInstance.getLayer('dots-layer')) mapInstance.removeLayer('dots-layer');
        if (mapInstance.getSource('dots')) mapInstance.removeSource('dots');
      }
    };
  
  }, [mapInstance, FCSTdata, data, conditions, showdots, showFCST]);
  
  // Separate useEffect for handling clicks
  // Separate useEffect for handling clicks
  useEffect(() => {
    if (!mapInstance) return;
  
    const handleMapClick = async (event) => {
      // Remove any existing popup before creating a new one
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
  
      let activeLayers = [];
      if (showFCST) activeLayers.push('point-layer');
      if (showdots) activeLayers.push('dots-layer');
  
      if (activeLayers.length === 0) return;
  
      const features = mapInstance.queryRenderedFeatures(event.point, {
        layers: activeLayers,
      });
  
      if (features.length > 0) {
        const clickedFeature = features[0];
        const confidence = clickedFeature.properties.confidence || 'N/A';
        const modelpred = clickedFeature.properties.modelpred || 'N/A';
        const imagePath = clickedFeature.properties.imagePath || ''; // Ensure imagePath is handled safely

        console.log("confidence")
        console.log(confidence)

        console.log("modelpred")
        console.log(modelpred)

        console.log("imagePath")
        console.log(imagePath)
  
        let popupContent = `<strong>Confidence:</strong> ${confidence}<br><strong>Model Prediction:</strong> ${modelpred}`;

        if (showdots && imagePath) {

          try {
            const response = await fetch(`https://xcitelab.org/dot-api?param1=&param2=&param3=&param4=&param5=&param6=${encodeURIComponent(imagePath)}`);
            
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          
            const blob = await response.blob();  // Convert response to Blob
            const imageUrl = URL.createObjectURL(blob);  // Create local URL for image
          
            console.log("Generated image URL:", imageUrl);  // Debugging
          
            popupContent += `<br><img src="${imageUrl}" alt="Feature Image" 
                              style="max-width: 200px; max-height: 150px; display: block; margin-top: 5px;">`;
          
          } catch (error) {
            console.error("Error fetching image:", error);
          }
        }
  
        popupRef.current = new mapboxgl.Popup()
          .setLngLat(event.lngLat)
          .setHTML(popupContent)
          .addTo(mapInstance);
  
        setTimeout(() => {
          document.querySelectorAll('.mapboxgl-popup-close-button').forEach(btn => {
            btn.removeAttribute('aria-hidden');
          });
        }, 0);
      }
    };
  
    mapInstance.on('click', handleMapClick);
  
    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      mapInstance.off('click', handleMapClick);
    };
  
  }, [mapInstance, showdots, showFCST]);

  
  return (


    <div style={{ marginTop: '0px', padding: '0px' }}>
      <h1 style={{ margin:'0',paddingBottom: '0px'}}>Road surface condition detection</h1>
      <p style={{ fontSize: '18px', fontStyle: 'italic' ,margin: '0', paddingTop: '0px', paddingBottom: '20px'}} >Detected by machine-learning models (AI)</p>
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

    

      <h2 style={{ margin: '0'}}> Choose the time to display <Tooltip content="Select whether to display current conditions (present/live), forecasted conditions (future), or historical conditions (from past events). The current conditions represent the real-time perspective with the most recently updated data, which is relevent for an up-to-date picture of the road surface conditions. The forecasted conditions represent future conditions, for which there are are no camera images to make predictions at the NYSDOT camera level. The Historical data option is to view past data, viewing the conditions from a case study perspective, which uses archived data." /></h2>
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
              minDate={new Date('2025-02-06T01:00:00')} // '2025-01-04T16:00:00' Start date: Jan 1st, 2024 HERE! FOR ADJUSTINGG HISTROICAL DATES! // '2025-01-04T16:00:00'
              maxDate={new Date('2025-02-07T23:00:00')} // '2025-01-06T23:00:00' selectedDateET //'2025-01-06T23:00:00'
              // minTime={new Date('2024-12-19T00:00:00').setHours(12, 0, 0)} // Earliest time: 8:00 AM
              // maxTime={new Date('2024-12-19T00:00:00').setHours(23, 0, 0)} // Latest time: 5:00 PM
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
            <span style={{ backgroundColor: 'purple', color: 'white', padding: '3px', borderRadius: '5px' }}>
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
              <span style={{ backgroundColor: 'darkblue', color: 'lightgray', padding: '3px', borderRadius: '5px' }}>
                Obstructed camera
              </span>
            </li>
          )}


        </ul>
      </div>
      <h2 style={{ margin: '0', padding: '0'}}>{`Displaying ${getTitle()}`}</h2>
{/*       
      <div>
          {(showdots) && (
              <p style={{ margin: '0', padding: '0' }}>{`Camera locations for: ${lastUpdateCam}`}</p>
          )}
          {(showFCST) && (
              <p style={{ margin: '0', padding: '0' }}>{`All locations (shading) for: ${lastUpdateFCST}`}</p>
          )}
      </div> */}
      
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