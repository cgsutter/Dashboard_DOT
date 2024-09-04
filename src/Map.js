// import * as React from 'react';
import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import camdata from "../data/dot_cam_latlon.js";
import camdata_current from "../data/dot_cam_current.js";
import camdata_casestudy from "../data/dot_cam_casestudy.js";
// import camdata_prior60 from "../data/dot_cam_latlon_color_prior60min.js";
// import camdata_future60 from "../data/dot_cam_latlon_color_future60min.js";
// import camdata_casestudy1a from "../data/dot_cam_latlon_color_casestudy_1a.js";
// import camdata_casestudy1b from "../data/dot_cam_latlon_color_casestudy_1b.js";
// import camdata_casestudy2a from "../data/dot_cam_latlon_color_casestudy_2a.js";
// import camdata_casestudy2b from "../data/dot_cam_latlon_color_casestudy_2b.js";
import ColorKey from './ColorKey.js';
import { api_token_mapbox } from '../credentials.js';
// const token = MY_CONSTANT
mapboxgl.accessToken = api_token_mapbox;



const Map = (props) => {
  const mapContainer = useRef(null);
  const { state } = props;
  const [toggle, setToggle] = useState(true); // Add a state variable for the toggle
  const [selectedDictionary, setSelectedDictionary] = useState('camdata_current');

  const getTitle = () => {
    switch (selectedDictionary) {
      case 'camdata_current':
        return 'Current road surface conditions';
      case 'camdata_casestudy':
        return 'Case study example of road surface conditions';
      // case 'camdata_casestudy_toggle1':
      //   return 'Case Study Example';
      // case 'camdata_casestudy_toggle2':
      //   return 'Case Study Example Alternative 2';
      // // Add more cases as needed
      default:
        return 'Road surface conditions';
    }
  };

  console.log("PRINT COLOR")
  // console.log(camdata_current['Skyline_5996'].color)
  // console.log("try logging here")
  // console.log(camdata_current[entry.id])

  const [conditions, setConditions] = useState({
    snow_severe: true,
    snow: true,
    wet: true,
    dry: true,
    poor_viz: false,
    obs: false,
  });

  const handleConditionChange = (event) => {
    setConditions((prevConditions) => ({
      ...prevConditions,
      [event.target.name]: event.target.checked,
    }));
  };

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v9',
      attributionControl: false,
      center: [state.lng, state.lat],
      zoom: state.zoom,
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


    // Add markers - original

    // const conditionOrder = [
    //   "snow_severe",
    //   "snow",
    //   "wet",
    //   "dry",
    //   "poor_viz",
    //   "obs",
    // ];

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

      conditionOrder.forEach((condition) => {
        camdata.forEach((entry) => {
          const rscData = (
            selectedDictionary === "camdata_current"
              ? camdata_current[entry.id]
              : selectedDictionary === "camdata_casestudy"
              ? camdata_casestudy[entry.id]
              : null
          ) ?? { final_model_pred: "NA", color: "black", confidence: "NA" };

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

  useEffect(() => {
    if (mapContainer.current && props.state.lng && props.state.lat) {
      // mapContainer.current.style.height = '750px'; 
    }
  }, [mapContainer, props.state.lng, props.state.lat]);

  const handleDictionaryChange = (event) => {
    setSelectedDictionary(event.target.value);
  };

  return (

    <div>
      <h1>{getTitle()}</h1>
      <div id="color-key">
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li style={{ marginBottom: '12px' }}>
            <input
              type="checkbox"
              name="snow_severe"
              checked={conditions.snow_severe}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'red', padding: '5px', color: 'white', borderRadius: '5px' }}>
              Severe snow
            </span>
          </li>
          <li style={{ marginBottom: '12px' }}>
            <input
              type="checkbox"
              name="snow"
              checked={conditions.snow}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'palevioletred', padding: '5px', color: 'white', borderRadius: '5px' }}>
              Snow
            </span>
          </li>
          <li style={{ marginBottom: '12px' }}>
            <input
              type="checkbox"
              name="wet"
              checked={conditions.wet}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'dodgerblue', padding: '5px', color: 'white', borderRadius: '5px' }}>
              Wet
            </span>
          </li>
          <li style={{ marginBottom: '12px' }}>
            <input
              type="checkbox"
              name="dry"
              checked={conditions.dry}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'green', padding: '5px', color: 'white', borderRadius: '5px' }}>
              Dry
            </span>
          </li>
          <li style={{ marginBottom: '12px' }}>
            <input
              type="checkbox"
              name="poor_viz"
              checked={conditions.poor_viz}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'purple', color: 'lightgray', padding: '5px', borderRadius: '5px' }}>
              Poor visibility
            </span>
          </li>
          <li style={{ marginBottom: '12px' }}>
            <input
              type="checkbox"
              name="obs"
              checked={conditions.obs}
              onChange={handleConditionChange}
            />
            <span style={{ backgroundColor: 'darkblue', color: 'lightgray', padding: '5px', borderRadius: '5px' }}>
              Obstructed
            </span>
          </li>

        
        </ul>
      </div>
      <select onChange={handleDictionaryChange} value={selectedDictionary}>
        <option value="camdata_current">Current (using camera)</option>
        <option value="camdata_casestudy">Case study example</option>
        <option value="camdata_future">Future (using forecast)</option>
        {/* <option value="camdata_future60">Future: 60 min forecast (using weather forecast)</option> */} 
        {/* Past: 60 min ago (using camera) */}
      </select>
      <div
        ref={mapContainer}
        style={{
          width: '80vw',
          height: '80vh',
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