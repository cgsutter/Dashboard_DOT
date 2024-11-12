// import * as React from 'react';
import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import camdata from "../data/dot_cam_latlon.js";

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
  const [showFCST, setShowFCST] = useState(false); // Toggle for FCST data

  // Toggle handler for checkbox
  const handleToggleChange = () => {
    setShowFCST(!showFCST);
  };


  // Return text for the dashboard title based on the user's selected case
  const getTitle = () => {
    switch (selectedDictionary) {
      case 'camlocs_current':
        return 'Current road surface conditions';
      case 'camlocs_case_20220203_06':
        return 'Case Study: Feb 3 2022 at 1am EST';
      case 'camlocs_case_20220203_18':
        return 'Case Study: Feb 3 2022 at 1pm EST';
      default:
        return 'Road surface conditions';
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

  // // Function to toggle auto-update on/off based on checkbox input
  // const handleAutoUpdateChange = (event) => {
  //   setAutoUpdate(event.target.checked);
  // };

  

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

  // // Define helper function to plot points and the model RSCs
  // const setupPlotPoints = (map, camdata, data, conditions, conditionOrder) => {
  //   conditionOrder.forEach((condition) => {
  //     camdata.forEach((entry) => {
  //       const rscData = (
  //         data[entry.id] ?? { final_model_pred: "NA", color: "black", confidence: "NA" }
  //       );
  
  //       if (rscData.final_model_pred === condition && conditions[condition.toLowerCase()]) {
  //         const el = document.createElement("div");
  //         el.className = "marker";
  //         el.style.background = rscData.color;
  //         el.style.width = "10px";
  //         el.style.height = "10px";
  //         el.style.borderRadius = "50%";
  
  //         new mapboxgl.Marker(el)
  //           .setLngLat([entry.lon, entry.lat])
  //           .setPopup(
  //             new mapboxgl.Popup().setHTML(
  //               `ID: ${entry.id} <br> Condition: ${rscData.final_model_pred} <br>  Confidence: ${rscData.confidence}`
  //             )
  //           )
  //           .addTo(map);
  //       }
  //     });
  //   });
  // };

  // Helper function to plot points based on condition and camdata
  const setupPlotPoints = (map, camdata, data, conditions) => {
    // Remove previous markers (if any) to avoid duplicates
    const markers = [];
    
    ["obs", "poor_viz", "dry", "wet", "snow", "snow_severe"].forEach((condition) => {
      camdata.forEach((entry) => {
        const rscData = (
          data[entry.id] ?? { final_model_pred: "NA", color: "black", confidence: "NA" }
        );

        // Check if the condition matches and if it's in the conditions
        if (rscData.final_model_pred === condition && conditions[condition.toLowerCase()]) {
          const el = document.createElement("div");
          el.className = "marker";
          el.style.background = rscData.color;
          el.style.width = "10px";
          el.style.height = "10px";
          el.style.borderRadius = "50%";

          const marker = new mapboxgl.Marker(el)
            .setLngLat([entry.lon, entry.lat])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `ID: ${entry.id} <br> Condition: ${rscData.final_model_pred} <br>  Confidence: ${rscData.confidence}`
              )
            );

          markers.push(marker); // Store marker for later cleanup
        }
      });
    });

    return markers; // Return markers array for further management
  };

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

  // Convert data to GeoJSON format if the FCST data changes (which will happen after the fcst dict changes, which will happen after the user sleects dropdown)
  // useEffect(() => {
  //   geoJSONData = convertDataToGeoJSON(FCSTdata);
  // }, [FCSTdata]);

  const setupPlotFCSTGradient = (map, geodata) => {
    // Add points data as a source
    map.addSource('points', {
      type: 'geojson',
      data: geodata
    });

    // Add circle layer for points with gradient effect
    map.addLayer({
      id: 'point-layer',
      type: 'circle',
      source: 'points',
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': 10, // adjust radius as needed for gradient spread, of 15 or 20 will make the points larger, causing more overlap and blending between adjacent points.
        'circle-opacity': 0.2, // make circles translucent, higher opacity (high values) vs lower opacity (more translucent, higher values here)
        'circle-blur': 1 // create a gradient-like blur effect A higher blur value gives a more “fuzzy” appearance, creating a gradient effect around each point. Lower blur values will make the edges sharper and more distinct.

      }
    });
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
    

  useEffect(() => {
    if (!mapInstance) return; // Ensure mapInstance is ready

    // Convert FCSTdata to GeoJSON
    const geoJSONData = convertDataToGeoJSON(FCSTdata);
  
    // without if statement to check the showFCST button
    // // **1. Manage forecast gradient (FCST) source and layer**
    // if (mapInstance.getSource('points')) {
    //   // Update the data if the source already exists
    //   mapInstance.getSource('points').setData(geoJSONData);
    // } else {
    //   // Create the source and layer if they don't exist
    //   mapInstance.addSource('points', {
    //     type: 'geojson',
    //     data: geoJSONData,
    //   });
  
    //   mapInstance.addLayer({
    //     id: 'point-layer',
    //     type: 'circle',
    //     source: 'points',
    //     paint: {
    //       'circle-color': ['get', 'color'],
    //       'circle-radius': 10,
    //       'circle-opacity': 0.2,
    //       'circle-blur': 1,
    //     },
    //   });
    // }
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
    const dotsData = convertDataToDots(data);
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

      // Check if the layers have been added in the correct order
      const layers = mapInstance.getStyle().layers;
      const fcstLayerIndex = layers.findIndex(layer => layer.id === 'point-layer');
      const dotsLayerIndex = layers.findIndex(layer => layer.id === 'dots-layer');

      // If the dots layer is below the FCST layer, we move it above
      if (dotsLayerIndex < fcstLayerIndex) {
        mapInstance.moveLayer( 'point-layer','dots-layer');
      }
      
    }


    return () => {
      if (mapInstance) {
        mapInstance.off('load'); // Clean up event listeners when component is unmounted or mapInstance changes
    }
  };
  }, [mapInstance, FCSTdata, camdata, data, conditions, showFCST]); // Re-run when any of these data dependencies change

// REMOVE OUT HERE
  // // repeat for cam locations 
  // const geoJSONData_camlocs = convertDataToGeoJSON(data);
  
  // // **1. Manage forecast gradient (FCST) source and layer**
  // if (mapInstance.getSource('points')) {
  //   // Update the data if the source already exists
  //   mapInstance.getSource('points').setData(geoJSONData_camlocs);
  // } else {
  //   // Create the source and layer if they don't exist
  //   mapInstance.addSource('points', {
  //     type: 'geojson',
  //     data: geoJSONData_camlocs,
  //   });

  //   mapInstance.addLayer({
  //     id: 'point-layer',
  //     type: 'circle',
  //     source: 'points',
  //     paint: {
  //       'circle-color': ['get', 'color'],
  //       'circle-radius': 10,
  //       'circle-opacity': 1,
  //       'circle-blur': 1,
  //     },
  //   });
  // }
  // Step 3: Handle camdata and update markers for each condition
  // const markers = setupPlotPoints(mapInstance, camdata, data, conditions);
  // markers.forEach((marker) => marker.addTo(mapInstance)); // Add all markers to the map

  // // Set up or update layers based on data changes
  // useEffect(() => {
  //   console.log("check if mapinstance tf")
  //   console.log(mapInstance)
  //   if (mapInstance) {
  //     // // Convert FCSTdata to GeoJSON and update or add the gradient layer
  //     // const geoJSONData = convertDataToGeoJSON(FCSTdata);
  //     // if (mapInstance.getSource('points')) {
  //     //   mapInstance.getSource('points').setData(geoJSONData);
  //     // } else {
  //     //   setupPlotFCSTGradient(mapInstance, geoJSONData);
  //     // }

  //     // // Update or add points for camdata
  //     // setupPlotPoints(mapInstance, camdata, data, conditions, [
  //     //   "obs", "poor_viz", "dry", "wet", "snow", "snow_severe"
  //     // ]);
  //     mapInstance.on('load', () => {
  //       // **Step 1**: Check for existing 'points' source and update instead of re-adding
  //       const geoJSONData = convertDataToGeoJSON(FCSTdata);
    
  //       if (mapInstance.getSource('points')) {
  //         mapInstance.getSource('points').setData(geoJSONData); // Update the source data if it exists
  //       } else {
  //         setupPlotFCSTGradient(mapInstance, geoJSONData); // Add new source if not present
  //       }
    
  //       // **Step 2**: Remove and re-add layers as needed to avoid duplicates
  //       if (mapInstance.getLayer('point-layer')) {
  //         mapInstance.removeLayer('point-layer');
  //       }
  //       if (mapInstance.getSource('points')) {
  //         mapInstance.removeSource('points');
  //       }
  //       setupPlotFCSTGradient(mapInstance, geoJSONData);
    
  //       // **Add plot points for camdata**
  //       setupPlotPoints(mapInstance, camdata, data, conditions, [
  //         "obs", "poor_viz", "dry", "wet", "snow", "snow_severe"
  //       ]);
  //     });
  //   }
  // return () => {
  //     if (mapInstance) mapInstance.off('load'); // Clean up event listeners
  // };
  // }, [mapInstance, FCSTdata, camdata, data, conditions]); // Only re-run when data changes


  // // load initial map once and store it into mapInstance for later, when adding layers on when calling layers onto the map based on dependencies. 
  // useEffect(() => {
  //   const map = setupMap(mapContainer.current, state);
  //   // Store the map instance for later use
  //   // setMapInstance(map);
  //   return () => map.remove();
  // }, []); // Empty dependency array ensures effect runs only once
  
  // useEffect(() => {
  //   const map = setupMap(mapContainer.current, state);

  //   map.on('load', () => {
  //     // Convert FCSTdata to GeoJSON format

  //     console.log("check before geojson conversion")
  //     console.log(FCSTdata)
  //     const geoJSONData = convertDataToGeoJSON(FCSTdata);
  
  //     console.log ("loaded geojson data")
  //     console.log("GeoJSON Data:", geoJSONData);
  //     // Plot the forecast gradient using the converted geoJSONData after map load
  //     setupPlotFCSTGradient(map, geoJSONData);
  
  //     // Plot points for camdata
  //     setupPlotPoints(map, camdata, data, conditions, [
  //       "obs", "poor_viz", "dry", "wet", "snow", "snow_severe"
  //     ]);
  //   });

  //   // const geoJSONData = convertDataToGeoJSON(FCSTdata);
  //   // setupPlotFCSTGradient(map, geoJSONData);
  //   // setupPlotPoints(map, camdata, data, conditions, [
  //   //   "obs", "poor_viz", "dry", "wet", "snow", "snow_severe"
  //   // ]);
  
  //   return () => map.remove();
  // }, [state, data, FCSTdata, conditions]); // update if the state changes (i.e. if map should be centered differently), but most commonly, update if the user defined selections change, either 1) the selected dropdown case, which affects the dictionary name, which affects the data to read in, and 2) which RSC classes to change


  // Explanation

  // useEffect(() => {
  //   const map = setupMap(mapContainer.current, state);
  //   // setupPlotFCSTGradient(map, FCSTdata);
  //   setupPlotFCSTGradient(map, FCSTdata);
  
  //   return () => map.remove();
  // }, [state, FCSTdata, conditions]);

  console.log("log selectedDictionar")
  console.log(selectedDictionary)
  console.log("log conditions")
  console.log(conditions)

  return (

    <div style={{ marginTop: '0px', padding: '0px' }}>
      <h1>{`${getTitle()}`}</h1>
      <h3>{`Updated at:`}</h3>
      <h3>{`${lastUpdateCam} for camera locations`}</h3>
      <h3>{`${lastUpdateFCST} for everywhere else`}</h3>
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

      <div>
        <label>
          <input type="checkbox" checked={showFCST} onChange={handleToggleChange} />
          Show FCST Data
        </label>
        <div id="mapContainer" style={{ width: '100%', height: '400px' }}></div>
      </div>

    
    </div>
  );

};

export default Map;