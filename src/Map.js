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
  const [selectedDictionary, setSelectedDictionary] = useState('dot_cam_current'); // selectedDictionary is the for the corresponding case that the user selected
  const [selectedFCSTDictionary, setSelectedFCSTDictionary] = useState('FCST_current'); // equivalent of the above but for fcst data
  const [data, setData] = useState({}); // Based on the selectedDictionary, load the corresponding data using the API and store it in data
  const [FCSTdata, setFCSTData] = useState({}); // equivalent of the above but for fcst data
  const [eventtype, setEventType] = useState('current') // event is the main user dropdown selection of what event they want displayed on the map, e.g. the current conditions, a past selected case of conditions, or future forecast-only conditons. This is a string which adjusts the dictionary names, and the dictionary names affects the api call to read in data, etc. 
  const [mapInstance, setMapInstance] = useState(null); // so map loads once, upon initial dashboard load or referesh, store it for later use when adding or editing layers of colored points or gradient shading

  // Return text for the dashboard title based on the user's selected case
  const getTitle = () => {
    switch (selectedDictionary) {
      case 'dot_cam_current':
        return 'Current road surface conditions';
      case 'camdata_casestudy_20220203_06':
        return 'Case Study: Feb 3 2022 at 1am EST';
      case 'camdata_casestudy_20220203_18':
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

    // const camlevelname = ''
    //  TO COME BACK TO: I think the map is loading twice bc of how the fcst dict changes AFTER the regular data dict changes
    //  add the second piece taht we want the toggle to adjust, the forecast only json file name too (not just the cam level one)
    console.log("log the value of dropdown change")
    console.log(value)
    setEventType(value)
    if (value === "current") {
      setSelectedFCSTDictionary("FCST_current");
      setSelectedDictionary("dot_cam_current");
    } else if (value === "20220203_06") {
      setSelectedFCSTDictionary("FCST_casestudy_20220203_06");
      setSelectedDictionary("camdata_casestudy_20220203_06");
    } else if (value === "20220203_18") {
      setSelectedFCSTDictionary("FCST_casestudy_20220203_18");
      setSelectedDictionary("camdata_casestudy_20220203_18");
    }
  };

  console.log("CHECK THE FCST ONLY DICT NAME!")
  console.log(selectedFCSTDictionary)

  console.log("CHECK THE SELECTED ONLY DICT NAME!")
  console.log(selectedDictionary)

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

      const data_readfromapi = await response.json();
      console.log("got through await response")

      //comment out response parts to get UI to load
      // // print stuff to check it
      // console.log('Full Response:', response);
      // console.log('Response Type:', typeof response); // "object"
      // console.log('Response Type22:', typeof response); // "object"
      // console.log('Response Constructor:', response.constructor.name); // "Response"
      // console.log(response["NYSDOT_4861013"])
      // console.log('Response Status Text:', response.statusText);
      // console.log('Response Headers:', response.headers);
      // console.log('Response Body Used:', response.bodyUsed);
      // console.log(response.ok)
      // console.log(response.status)

      // console.log('Data Type:', typeof data_readfromapi); // "object"
      // console.log('JSON Data:', data_readfromapi);
      console.log('try printing in map when pulling data from api');
      console.log('JSON Data:', data_readfromapi);
      setData(data_readfromapi); // Update data state
      // const dataReadFromAPI = await response.text(); // Change to text()
      // console.log('API Response:', dataReadFromAPI);
      // const jsonData = JSON.parse(dataReadFromAPI); // Attempt parsing
      // setData(jsonData);
      // console.log('after setdta should exist:', data);
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

      const data_readfromapi = await response.json();
      console.log("got through await response FCST")

      // console.log('try printing in map when pulling data from api');
      console.log('FCST JSON Data:', data_readfromapi);
      setFCSTData(data_readfromapi);
      console.log('after setFCST data FCSTdata should exist:', FCSTdata);
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
    console.log("IMP CHECK HERE")
    console.log(FCSTdata)
  }, [selectedFCSTDictionary]);


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

  // load initial map once and store it into mapInstance for later, when adding layers on when calling layers onto the map based on dependencies. 
  useEffect(() => {
    const map = setupMap(mapContainer.current, state);
    // Store the map instance for later use
    setMapInstance(map);
    return () => map.remove();
  }, []); // Empty dependency array ensures effect runs only once


  // Define helper function to plot points and the model RSCs
  const setupPlotPoints = (mapinput, camdata, data, conditions, conditionOrder) => {
    conditionOrder.forEach((condition) => {
      camdata.forEach((entry) => {
        const rscData = (
          data[entry.id] ?? { final_model_pred: "NA", color: "black", confidence: "NA" }
        );

        if (rscData.final_model_pred === condition && conditions[condition.toLowerCase()]) {
          const el = document.createElement("div");
          el.className = "marker";
          el.style.background = rscData.color;
          el.style.width = "10px";
          el.style.height = "10px";
          el.style.borderRadius = "50%";

          new mapboxgl.Marker(el)
            .setLngLat([entry.lon, entry.lat])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `ID: ${entry.id} <br> Condition: ${rscData.final_model_pred} <br>  Confidence: ${rscData.confidence}`
              )
            )
            .addTo(mapinput);
        }
      });
    });
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


  const setupPlotFCSTGradient = (map, geodata) => {
    // Add points data as a source
    // Since code was updated to only render main map once (and the plooted points and shading will just be updated based on dependencies in the useeffect) we have to specifically update the points if they already exist, 
    map.addSource('points', {
      type: 'geojson',
      data: geodata
    });

    // if (map.hasSource('points')) {
    //   // Update existing source's data
    //   map.getSource('points').setData(geodata);
    // } else {
    //   // Add new source and layer
    //   map.addSource('points', {
    //     type: 'geojson',
    //     data: geodata
    //   });


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


  useEffect(() => {
    if (!mapInstance) return;

    // mapInstance.on('load', () => {

    // Convert FCSTdata to GeoJSON format

    console.log("check before geojson conversion")
    console.log(FCSTdata)
    // const geoJSONData = convertDataToGeoJSON(FCSTdata);

    // console.log("loaded geojson data")
    // console.log("GeoJSON Data:", geoJSONData);
    // Plot the forecast gradient using the converted geoJSONData after map load
    // setupPlotFCSTGradient(mapInstance, geoJSONData);

    // Plot points for camdata
    console.log(data)
    setupPlotPoints(mapInstance, camdata, data, conditions, [
      "obs", "poor_viz", "dry", "wet", "snow", "snow_severe"
    ]);

    // });
  }, [mapInstance, state, eventtype, data, FCSTdata, conditions]); // update if the state changes (i.e. if map should be centered differently), but most commonly, update if the user defined selections change, either 1) the selected dropdown case, which affects the dictionary name, which affects the data to read in, and 2) which RSC classes to change


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
        <h1>{getTitle()}</h1>
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
              <span style={{ backgroundColor: 'purple', color: 'lightgray', padding: '3px', borderRadius: '5px' }}>
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
              <span style={{ backgroundColor: 'darkblue', color: 'lightgray', padding: '3px', borderRadius: '5px' }}>
                Obstructed
              </span>
            </li>


          </ul>
        </div>
        {/*  when user selection changes, value is updated, and value is passed to handledictionary change */}
        <select onChange={handleDictionaryChange} value={eventtype}>
          <option value="current">Current (using camera)</option>
          {/* <option value="camdata_casestudy">Case study example</option> */}
          <option value="20220203_06">Case study: Feb 3 2022 1am EST</option>
          <option value="20220203_18">Case study: Feb 3 2022 1pm EST</option>
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

      </div>
    );

  };

  export default Map;