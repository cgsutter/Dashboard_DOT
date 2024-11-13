// import * as React from 'react';
import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import camdata from "../data/dot_cam_latlon.js";
import Tooltip from './Tooltip'; // Import the Tooltip component


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
  const [autoRefresh, setAutoRefresh] = useState(true);
  // const [current, setCurrent] = useState('')
  // const [case1, setcase1] = useState('')
  // const [fcst2hr, setfcst2hr] = useState('')
  // const [fcst2hr, setfcst2hr] = useState('')


  // // Toggle handler for checkbox
  // const handleToggleChange = () => {
  //   setShowFCST(!showFCST);
  // };

  // const handleToggleChange = () => {
  //   setShowdots(!showdots);
  // };


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
    } else if (value === "camdlocs_case_20220203_06") { //camdata_casestudy_20220203_06
      setSelectedFCSTDictionary("FCST_casestudy_20220203_06");
    } else if (value === "camlocs_case_20220203_18") {
      setSelectedFCSTDictionary("FCST_casestudy_20220203_18");
    }
  };

  console.log("CHECK THE FCST ONLY DICT NAME!")
  console.log(selectedFCSTDictionary)

  // Function to toggle auto-update on/off based on checkbox input
  const handleAutoUpdateChange = (event) => {
    setAutoUpdate(event.target.checked);
  };

  

  // Second: Load in the data

  // Define this function that, when called on (see useEffect later) will load the corresponding data based on user selection
  const fetchData = async () => {
    try {
      console.log("beginning fetch")
      console.log(selectedDictionary)
      const response = await fetch(`https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3009/data?param=${selectedDictionary}`, {
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
      setData(apiResponse.data); // Update data state
      setLastUpdateCam(apiResponse.time)

    } catch (error) {
      console.error('API Error:', error.message);
    }
  };

  const fetchFCST = async () => {
    try {
      console.log("beginning FCST fetch")
      console.log(selectedFCSTDictionary)
      const response = await fetch(`https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3009/data?param=${selectedFCSTDictionary}`, {
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

 

  useEffect(() => {
    // load camspot data
    console.log('Component rendered, fetch should occur');
    console.log('selectedDictionary:', selectedDictionary);
    fetchData();
  }, [selectedDictionary]);
    

  useEffect(() => {
    // load fcst data. Could put this in the same useeffect above since if one dict changes the other one does too
    console.log('Component rendered for FCST, fetch should occur for FCST');
    console.log('selectedFCSTDictionary:', selectedFCSTDictionary);
    fetchFCST();
  }, [selectedDictionary,selectedFCSTDictionary]);



  
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
            'circle-radius': 10,
            'circle-opacity': 0.2,
            'circle-blur': 1,
          },
        });
      }
    } else {
      // Remove the FCST layer if it exists and showFCST is false
      if (mapInstance.getLayer('point-layer')) {
        mapInstance.removeLayer('point-layer');
      }
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
          'before': 'point-layer', // Adjust index as needed
        });
      }
    // Check if the layers have been added in the correct order
    const layers = mapInstance.getStyle().layers;
    const fcstLayerIndex = layers.findIndex(layer => layer.id === 'point-layer');
    const dotsLayerIndex = layers.findIndex(layer => layer.id === 'dots-layer');

    // If the dots layer is below the FCST layer, we move it above
    if (dotsLayerIndex < fcstLayerIndex) {
      mapInstance.moveLayer( 'point-layer','dots-layer');
    }
    
  }


  // Cleanup function
  return () => {
    if (mapInstance) {
      if (mapInstance.getLayer('point-layer')) {
        mapInstance.removeLayer('point-layer');
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

      <h3 style={{ margin: '0', padding: '0'}}>{`Colored Dots: road surface conditions at NYSDOT Camera Locations`}
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
      </h3>
      
      <p style={{margin: '0', padding: '0', marginBottom: '5px'}}>{`Last updated: ${lastUpdateCam}`}</p>
      {/* <h3>{`${lastUpdateFCST} for everywhere else`}</h3> */}
      <h3 style={{ margin: '0', padding: '0'}}>{`Shading: road surface conditions in all areas`}
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
      </h3>
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

      <select onChange={handleDictionaryChange} value={selectedDictionary}>
        <option value="camlocs_current">Current (using camera)</option>
        {/* <option value="camdata_casestudy">Case study example</option> */}
        <option value="camlocs_case_20220203_06">Case study: Feb 3 2022 1am EST</option>
        <option value="camlocs_case_20220203_18">Case study: Feb 3 2022 1pm EST</option>
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