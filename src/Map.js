// import * as React from 'react';
import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import camdata from "../data/dot_cam_latlon.js";

import { api_token_mapbox } from '../credentials.js';
// const token = MY_CONSTANT 
mapboxgl.accessToken = api_token_mapbox;

import axios from 'axios';


const Map = (props) => {
  const mapContainer = useRef(null);
  const { state } = props;
  const [toggle, setToggle] = useState(true); // Add a state variable for the toggle
  const [selectedDictionary, setSelectedDictionary] = useState('dot_cam_current'); // setSelectedDictionary is the function that that runs to change selectedDictionary
  const [data, setData] = useState({}); // State to store API data

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


  // const fetchData = async () => {
  //   try {
  //     const response = await fetch(`https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3001/data?param=${selectedDictionary}`, {
  //     mode: 'no-cors', // Disable CORS
  //     });
  //     // const response = await fetch(`https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3001/data?param=${selectedDictionary}`);
  //     const data_readfromapi = await response.json();
  //     console.log('try printing in map when pulling data from api');
  //     setData(data_readfromapi); // Update data state
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const handleDictionaryChange = (event) => {
    setSelectedDictionary(event.target.value);
  };

  // console.log('print dictionary here')
  // console.log(selectedDictionary)


  const fetchData = async () => {
    try {
      console.log("beginning fetch")
      console.log(selectedDictionary)
      // const response = await fetch('https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3001', {
      //   method: 'GET',
      //   credentials: 'include', // Include cookies
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // })
      const response = await fetch(`https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3009/data?param=${selectedDictionary}`, {
        method: 'GET',
        // credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      })
      // .then(async (res)=> await console.log('res',res.json()));
      console.log("got through await fetch")
      console.log(response.status)
     
      const data_readfromapi = await response.json();
      console.log("got through await response")

      //comment out response parts to get UI to load
      console.log('Full Response:', response);
      console.log('Response Type:', typeof response); // "object"
      console.log('Response Type22:', typeof response); // "object"
      console.log('Response Constructor:', response.constructor.name); // "Response"
      console.log(response["NYSDOT_4861013"])
      console.log('Response Status Text:', response.statusText);
      console.log('Response Headers:', response.headers);
      console.log('Response Body Used:', response.bodyUsed);
      console.log(response.ok)
      console.log(response.status)

      // console.log('Data Type:', typeof data_readfromapi); // "object"
      // console.log('JSON Data:', data_readfromapi);
      console.log('try printing in map when pulling data from api');
      console.log('JSON Data:', data_readfromapi);
      setData(data_readfromapi); // Update data state
      // const dataReadFromAPI = await response.text(); // Change to text()
      // console.log('API Response:', dataReadFromAPI);
      // const jsonData = JSON.parse(dataReadFromAPI); // Attempt parsing
      // setData(jsonData);
    } catch (error) {
      console.error('API Error:', error.message);
    }
  };


  useEffect(() => {
    console.log('Component rendered, fetch should occur');
    console.log('selectedDictionary:', selectedDictionary);
    fetchData();
  }, [selectedDictionary]);

  console.log("print data")
  console.log(data)

  // const handleDictionaryChange = (event) => {
  //   setSelectedDictionary(event.target.value);
  // };

  // console.log('print dictionary here')
  // console.log(selectedDictionary)



  
  const [conditions, setConditions] = useState({
    snow_severe: true,
    snow: true,
    wet: true,
    dry: true,
    poor_viz: true,
    obs: true,
  });

  const handleConditionChange = (event) => {
    setConditions((prevConditions) => ({
      ...prevConditions,
      [event.target.name]: event.target.checked,
    }));
  };

  console.log("log conditions")
  console.log(conditions)

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v9',
      attributionControl: false,
      center: [state.lng, state.lat],
      zoom: state.zoom,
      // alignItems: "top"
    });

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

    // Loop through the conditions in the specified orderconditionOrder.forEach((condition) => {
    // Add markers - original
    if (Array.isArray(camdata)) {
      const conditionOrder = [
        "obs",
        "poor_viz",
        "dry",
        "wet",
        "snow",
        "snow_severe",
      ];

      // plot each dot of conditions on layered order (most severe up top)
      // e.g. all the dry conditions, grab cam entries who have dry condition, and plot them. Do this for each condition (the .forEach is essentially a loop)
      conditionOrder.forEach((condition) => {
        camdata.forEach((entry) => {
          // for each lat lon in camdata (which is just site, lat, lon), grab the corresponding conditions from the clasification dictionary (setData) by grabbing the key entry.id and its corresponding values 
          const rscData = (
            data[entry.id] ?? { final_model_pred: "NA", color: "black", confidence: "NA" }
          );
          // check if the classification is the condition that we're currently looping through (can probably rearrange this code eventually since this could be outside the main loop)
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
              .addTo(map);
          }
        });
      });
    }

    return () => map.remove();
  }, [state, toggle, selectedDictionary, conditions]);
// [state, toggle, selectedDictionary, conditions]
  console.log("log state")
  console.log(state)
  console.log("log toggle")
  console.log(toggle)
  console.log("log selectedDictionar")
  console.log(selectedDictionary)
  console.log("log conditions")
  console.log(conditions)
  useEffect(() => {
    if (mapContainer.current && props.state.lng && props.state.lat) {
      // mapContainer.current.style.height = '750px'; 
    }
  }, [mapContainer, props.state.lng, props.state.lat]);

  //  handle change was here


  return (

    <div style={{ marginTop: '0px', padding:'0px' }}>
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
      <select onChange={handleDictionaryChange} value={selectedDictionary}>
        <option value="dot_cam_current">Current (using camera)</option>
        {/* <option value="camdata_casestudy">Case study example</option> */}
        <option value="camdata_casestudy_20220203_06">Case study: Feb 3 2022 1am EST</option>
        <option value="camdata_casestudy_20220203_18">Case study: Feb 3 2022 1pm EST</option>
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