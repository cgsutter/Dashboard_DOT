// import * as React from 'react';
import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import camdata from "../data/dot_cam_latlon.js";
import Tooltip from './Tooltip'; // Import the Tooltip component
import {roundTimeHour} from './timing_helper.js';
import {prepFileString} from './timing_helper.js';
import {prepListForecastOptions} from './timing_helper.js';
import {prepFileString_fcst} from './timing_helper.js';

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
  const [selectedContext, setSelectedContext] = useState('Live'); // "Live" or "Forecast" or "Historical"
  const [subdir, setSubdir] = useState('data_camlevel'); // this will be adjusted based on the selection of Context (this is not a toggle itself, but changed based on user toggle)
  const [selectedDate, setSelectedDate] = useState(new Date('2024-01-01T00:00:00'));  // Default to the current date bc cant use null
  const [rounded, setRounded] = useState(new Date());
  const [stringDate, setStringDate] = useState('');
  const [forecastOptions, setForecastOptions] = useState([]); // State to hold date options
  const [selectedForecast, setSelectedForecast] = useState('Forecast for 11/15/2024, 09:00 PM ET');
  const [fileForecast, setFileForecast] = useState('');
  // these should be for historic only
  // For the 
  // const [autoRefresh, setAutoRefresh] = useState(true);
  // const [current, setCurrent] = useState('')
  // const [case1, setcase1] = useState('')
  // const [fcst2hr, setfcst2hr] = useState('')
  // const [fcst2hr, setfcst2hr] = useState('')

  
  console.log(rounded)

  // // Toggle handler for checkbox
  // const handleToggleChange = () => {
  //   setShowFCST(!showFCST);
  // };

  // const handleToggleChange = () => {
  //   setShowdots(!showdots);
  // };

  console.log("SELECTED DATE FOR HISTORICAL CHECK")
  console.log(selectedDate)

  // Return text for the dashboard title based on the user's selected case
  const getTitle = () => {
    switch (selectedDictionary) {
      case 'camlocs_current':
        return 'Map: Current road surface conditions';
      case 'camlocs_case_20220203_06':
        return 'Map: Case Study: Feb 3 2022 at 1am EST';
      case 'camlocs_case_20220203_18':
        return 'Map: Case Study: Feb 3 2022 at 1pm EST';
      default:
        return 'Map: Road surface conditions';
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

  console.log("log conditions")
  console.log(conditions)

  // Define this function to handle whichever case the user wants to map, based on their selection from the dropdown dashbaord
  const handleDictionaryChange = (event) => {
    const value = event.target.value;
    setSelectedDictionary(value);

    //  TO COME BACK TO: I think the map is loading twice bc of how the fcst dict changes AFTER the regular data dict changes
    //  add the second piece taht we want the toggle to adjust, the forecast only json file name too (not just the cam level one)
    if (value === "camlocs_current") {
      setSelectedFCSTDictionary("FCST_current");
    } else if (value === "camlocs_case_20220203_06") { //camdata_casestudy_20220203_06
      setSelectedFCSTDictionary("FCST_casestudy_20220203_06");
    } else if (value === "camlocs_case_20220203_18") {
      setSelectedFCSTDictionary("FCST_casestudy_20220203_18");
    }
  };

  console.log("CHECK THE FCST ONLY DICT NAME!")
  console.log(selectedFCSTDictionary)

  // // Function to toggle auto-update on/off based on checkbox input
  // const handleAutoUpdateChange = (event) => {
  //   setAutoUpdate(event.target.checked);
  // };

  // Handle dropdown change (Live or Historical)
  const handleContextChange = (e) => {
    const usercontext = e.target.value;
    setSelectedContext(usercontext); // change user context (see where this is needed)
    // also change subdir
    // maybe better to move these under a useeffect although can do similar things?
 
  };




  // useEffect(() => {
  //   // load camlevel data
  //   // note that the runFetch async function is necessary *inside* this useeffect because we can't use await inside the ueseffect directly (due to synchronous requirement of the useffect hook) but yet we have to wait (async) for the data to load before trying to complete the useffect (o/w it may move on without having data loaded)
  //   const runFetch = async () => {
  //     try {
  //       console.log('Component rendered, fetch should occur');
  //       console.log(subdir)
  //       console.log('selectedDictionary:', selectedDictionary);
  
  //       const dataloaded_camlevel = await fetchData(subdir);
  //       setData(dataloaded_camlevel);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };
  
  //   runFetch();
  // }, [selectedDictionary]);

  // useEffect(() => {

  //   // const rounded_calculated = roundTimeHour(selectedDate);
  //   setRounded(roundTimeHour(selectedDate));

  // }) [selectedDate]



  useEffect(() => {
    if (selectedContext === "Live") { 
      // set the subdir for the API to search for the most recent file for camlevel
      setSubdir("data_camlevel");
      // set the current datetime for the API to search for the best hrrr-level data. Note that upon loading, the default will use the current time, but need this in here in case the user switches from live, to historical, and then back to live (need to reset it to current time)
      const now = new Date(); 
      console.log(now); 
      setSelectedDate(now) 
      // setSelectedDate('2024-01-01T00:00:00') ; // this is for the forecast file pull
    } else if (selectedContext === "Historical") { // if the user selects historical or forecast, they will select the datetime they want and it will be set that way
      setSubdir("data_hrrrlevel");
    } else if (selectedContext === "Forecast") {
      setSubdir("data_hrrrlevel");
    }
  }, [selectedContext]);

  useEffect(() => {
    setRounded(roundTimeHour(selectedDate));
  }, [selectedDate]);


  useEffect(() => {
    setStringDate(prepFileString(rounded));
  }, [rounded]);


  useEffect(() => {
    setForecastOptions(prepListForecastOptions(rounded));
  }, [rounded]);

  console.log("PRINT TIME FOR LIVE")
  console.log(selectedDate)

  console.log("ROUNDD?")
  console.log(rounded)

  console.log("stringdate is")
  console.log(stringDate)

  console.log("forecast options is")
  console.log(forecastOptions)

  console.log("subdir write")
  console.log(subdir)

  console.log("send context, ")

  // Handle date change from DatePicker
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // // // Handle date change from DatePicker
  // const handleForecasetChange = (date) => {
  //   setSelectedForecast(date);
  // };

  // Handle dropdown change (Live or Historical)
  const handleForecasetChange = (e) => {
    const userforecast = e.target.value;
    setSelectedForecast(userforecast); // change user context (see where this is needed)
    // also change subdir
    // maybe better to move these under a useeffect although can do similar things?
  
  };

  console.log("set selected fcst")
  console.log(selectedForecast)

  // // useEffecrt
  // // prepFileString_fcst
  useEffect(() => {
    setFileForecast(prepFileString_fcst(selectedForecast));
  }, [selectedForecast]);

  console.log("FILE for forecast")
  console.log(fileForecast)







  // useEffect(() => {
  //   setStringDate(prepFileString(rounded));
  // }, [rounded]);
  

  // Second: Load in the data

  // Define this function that, when called on (see useEffect later) will load the corresponding data based on user selection
  const fetchData = async (subdirinput, dictinput) => {
    try {
      console.log("beginning fetch")
      console.log(dictinput)
      console.log(`${subdirinput}/${dictinput}`)
      const response = await fetch(`https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3009/data?param=${subdirinput}`, {
        method: 'GET',
        // credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      })
      // .then(async (res)=> await console.log('res',res.json()));
      console.log("got through await fetch")
      // console.log(response.status)

      if (!response.ok) {
        console.error("Failed to fetch data:", response.statusText);
        return;
      }
     
      const apiResponse = await response.json();
      console.log('API Response:', apiResponse); // Log API response
      console.log("through here????")

      console.log('try printing in map when pulling data from api');
      console.log('JSON Data CAMLEVEL:', apiResponse.data);
      console.log('TIME OF CAM DATA UPDATE:', apiResponse.time);
      // setData(apiResponse.data); // Update data state
      // setLastUpdateCam(apiResponse.time)
      // need to also return time

      return apiResponse.data

    } catch (error) {
      console.error('API Error:', error.message);
    }
  };

  const fetchFCST = async () => {
    try {
      console.log("beginning FCST fetch")
      console.log(selectedFCSTDictionary)
      const response = await fetch(`https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3009/data?param=data_live/hrrrlevel/${selectedFCSTDictionary}`, {
        method: 'GET',
        // credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      })
      // .then(async (res)=> await console.log('res',res.json()));
      console.log("got through await fetch FCST")
      // console.log(response.status)
     
      if (!response.ok) {
        console.error("Failed to fetch data:", response.statusText);
        return;
      }
     
      const apiResponse = await response.json();
      console.log('API Response:', apiResponse); // Log API response
      console.log("through here????")

      // console.log('try printing in map when pulling data from api');
      console.log('FCST JSON Data:', apiResponse.data);
      setFCSTData(apiResponse.data);
      console.log('after setFCST data FCSTdata should exist:', FCSTdata);
      // console.log('here1')
      console.log(apiResponse.time)
      setLastUpdateFCST(apiResponse.time)
    } catch (error) {
      console.error('API Error:', error.message);
    }
  };

  // Load the data
  // Do this by calling the fetchdata function when selectedDictionary changes (based on user intraction), and do this by using the built in React useEffect feature

  // const runFetch = async () => {
  //   console.log('Component rendered, fetch should occur');
  //   console.log('selectedDictionary:', selectedDictionary);
    
  //   const dataloaded_camlevel = await fetchData(selectedDictionary);
  //   setData(dataloaded_camlevel);
  // };

  useEffect(() => {
    // load camlevel data
    // note that the runFetch async function is necessary *inside* this useeffect because we can't use await inside the ueseffect directly (due to synchronous requirement of the useffect hook) but yet we have to wait (async) for the data to load before trying to complete the useffect (o/w it may move on without having data loaded)
    const runFetch = async () => {
      try {
        console.log('Component rendered, fetch should occur');
        console.log(subdir)
        console.log('selectedDictionary:', selectedDictionary);
  
        const dataloaded_camlevel = await fetchData(subdir);
        setData(dataloaded_camlevel);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    runFetch();
  }, [selectedDictionary]);

  console.log("updated new way with dictname input!")
    

  useEffect(() => {
    // same as above but for hrrrlevel; see notes useffect above
    const runFetch = async () => {
      try {
        console.log('Component rendered, fetch should occur');
        console.log(subdir)
        console.log('selectedFCSTDictionary:', selectedFCSTDictionary);
  
        const dataloaded_hrrrlevel = await fetchData(subdir, selectedFCSTDictionary);
        setFCSTData(dataloaded_hrrrlevel);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    runFetch();
  }, [selectedFCSTDictionary]);

  console.log("updated new way with dictname input on FCST!!")


  
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

    console.log("check what is data")
    console.log(data)

    // convert into array of conditions 
    const conditionsArray = makeArray(conditions)

    console.log("check what is conditions (these are user-selected")
    console.log(conditions)
    // Filter and order the data
    // Step 1: Filter the data based on selected conditions
    const filteredData = filterDataByConditions(data, conditionsArray);

    // Step 2: Reorder the filtered data based on the specified priority
    const orderedData = reorderDataByPriority(filteredData,["obs","poor_viz", , "dry", "wet", "snow","snow_severe"]);

    // const filteredData = filterDataByConditions(data, conditions);
    // const orderedData = orderDataByPriority(filteredData, ["snow_severe", "snow", "wet", "dry", "poor_viz", "obs"]);
    

    const dotsData = convertDataToDots(orderedData); //data


    if (showdots) {
      console.log("DOTS DATA!!")
      console.log(dotsData)

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

  console.log("log selectedDictionar")
  console.log(selectedDictionary)
  console.log("log conditions")
  console.log(conditions)

  return (

    <div style={{ marginTop: '0px', padding: '0px' }}>
      <h1>{`${getTitle()}`}</h1>
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

    

      <h2 style={{ margin: '0', padding: '0'}}> Context <Tooltip content="Select whether to display live data or historical data. Live data is the real-time perspective with the most recently updated data, which relevent for an up-to-date picture of the road surface conditions (current and forecasted). The Historical data option is to view past data, viewing the conditions from a case study perspective, which uses archived data." /></h2>
      <p style={{ margin: '0', padding: '0'}}>Display live data </p>
      <p style={{ marginTop: '0', marginBottom: '10px'}}>Display historical data (SELECT DATE) </p>
      <div>
        {/* First dropdown: Live or Historical */}
        <select value={selectedContext} onChange={handleContextChange}>
          <option value="Live">Live</option>
          <option value="Forecast">Forecast</option>
          <option value="Historical">Historical</option>
        </select>

        {/* Conditional rendering for datetime picker */}
        {selectedContext === 'Historical' && (
          <div>
            <label>Select Date and Time</label>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              showTimeSelect
              timeIntervals={5} // Time increments of 5 minutes
              minDate={new Date('2024-01-01T00:00:00')} // Start date: Jan 1st, 2024
              dateFormat="Pp" // Date format: MM/DD/YYYY HH:MM
              timeCaption="Time"
              timeFormat="HH:mm"
            />
          </div>
        )}

        {/* Conditional rendering for forecast selection */}
        {selectedContext === 'Forecast' && (
          <div>
            <label>Select Option: </label>
            <select value={selectedForecast} onChange={handleForecasetChange}>
                {forecastOptions.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </select>
          </div>
        )}

      </div>
      <h2 style={{ margin: '0', padding: '0'}}>Location</h2>
      <p style={{ margin: '0', padding: '0'}}>{`At NYSDOT Camera Locations`}
        <Tooltip content="Data is refreshed every 5 minutes. This option shows model-predicted road surface condition data for locations where there are camera images. Weather data is also incorporated." />
        <label style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '10px' }}>
            <input
              type="checkbox"
              checked={showdots}
              onChange={(e) => setShowdots(e.target.checked)}
              // style={{ marginLeft: '5px' }}
              style={{ transform: 'scale(1.5)', marginRight: '5px' }}
            />
            {/* Show FCST Data  */}
            {/*  uncomment above ^ to add checkbox name */}
          </label>
      </p>
      
      <p style={{margin: '0', padding: '0', marginBottom: '5px'}}>{`Last updated: ${lastUpdateCam}`}</p>
      {/* <h3>{`${lastUpdateFCST} for everywhere else`}</h3> */}
      <p style={{ margin: '0', padding: '0'}}>{`All Areas`}
      {/* <h4>{`Last updated at ${lastUpdateCam}`}</h3> */}
        <Tooltip content="Data is refreshed at the top of the hour. This option shows model-predicted road surface condition data for all geographic locations based on weather data only, no camera image." />
        <label style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '10px' }}>
            <input
              type="checkbox"
              checked={showFCST}
              onChange={(e) => setShowFCST(e.target.checked)}
              // style={{ marginLeft: '5px' }}
              style={{ transform: 'scale(1.5)', marginRight: '5px' }}
            />
            {/* Show FCST Data  */}
            {/*  uncomment above ^ to add checkbox name */}
          </label>
      </p>
      <p style={{margin: '0', padding: '0'}}>
        {`Last updated: ${lastUpdateFCST}`}
      </p>
      {/* <div>
        <label>
          <input type="checkbox" checked={showFCST} onChange={handleToggleChange} />
          Show FCST Data
        </label>
      </div> */}
      <div id="color-key">
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li style={{ marginBottom: '5px' }}>
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
          <li style={{ marginBottom: '5px' }}>
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
          <li style={{ marginBottom: '5px' }}>
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
          <li style={{ marginBottom: '5px' }}>
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
          <li style={{ marginBottom: '5px' }}>
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
          <li style={{ marginBottom: '5px' }}>
            <input
              type="checkbox"
              name="obs"
              checked={conditions.obs}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'black', color: 'lightgray', padding: '3px', borderRadius: '5px' }}>
              Obstructed
            </span>
          </li>


        </ul>
      </div>
      <h2 style={{ margin: '0', padding: '0'}}>Conditions:</h2>

      <select onChange={handleDictionaryChange} value={selectedDictionary}>
        <option value="camlocs_current">Currently </option>
        {/* <option value="camdata_casestudy">Case study example</option> */}
        <option value="camlocs_case_20220203_06">Forecast in 2 Hours</option>
        <option value="camlocs_case_20220203_18">Forecast in 2 Hours</option>
      </select>
      
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