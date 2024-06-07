// import * as React from 'react';
import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import camdata from "../data/dot_cam_latlon.js";
import camdatacolor_current from "../data/dot_cam_latlon_color_current.js";
import camdatacolor_prior60 from "../data/dot_cam_latlon_color_prior60min.js";
import camdatacolor_future60 from "../data/dot_cam_latlon_color_future60min.js";
import { api_token_mapbox } from '../credentials.js';
// const token = MY_CONSTANT
mapboxgl.accessToken = api_token_mapbox;



const Map = (props) => {
    const mapContainer = useRef(null);
    const { state } = props;
    const [toggle, setToggle] = useState(true); // Add a state variable for the toggle
    const [selectedDictionary, setSelectedDictionary] = useState('camdatacolor_current'); 


    console.log("PRINT COLOR")
    console.log(camdatacolor_current['Skyline_5996'])
    

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
                            'line-width': 2
                        }
                    });
                });
        
        
        // Add markers
        if (Array.isArray(camdata)) {
            camdata.forEach(entry => {
                const el = document.createElement('div');
                el.className = 'marker';
                // el.style.background = 'red';
                // el.style.background = camdatacolor_current[(entry.id)];
                el.style.background = selectedDictionary === 'camdatacolor_current' ? camdatacolor_current[entry.id] : selectedDictionary === 'camdatacolor_prior60' ? camdatacolor_prior60[entry.id] : camdatacolor_future60[entry.id];

                el.style.width = '10px';
                el.style.height = '10px';
                el.style.borderRadius = '50%';

                new mapboxgl.Marker(el)
                    .setLngLat([entry.lon, entry.lat])
                    .setPopup(new mapboxgl.Popup().setText(entry.id))
                    .addTo(map);
            });
        } else {
            console.error('Data is not an array');
        }

        return () => map.remove();
    }, [state, toggle, selectedDictionary]);

    useEffect(() => {
        if (mapContainer.current && props.state.lng && props.state.lat) {
            mapContainer.current.style.height = '750px'; 
        }
    }, [mapContainer, props.state.lng, props.state.lat]);

    const handleDictionaryChange = (event) => {
        setSelectedDictionary(event.target.value);
      };

    // return (
    //     <div
    //       ref={mapContainer}
    //       style={{
    //         width: '100%',
    //         height: '100%',
    //         position: 'relative',
    //       }}
    //     >
    //       {/* Map will render here */}
    //     </div>
    //   );
    // };
    // return (
    //     <div>
    //       <button onClick={() => setToggle(!toggle)}>Toggle Dictionary</button> {/* Add a toggle button */}
    //       <div
    //         ref={mapContainer}
    //         style={{
    //           width: '100%',
    //           height: '100%',
    //           position: 'relative',
    //         }}
    //       >
    //         {/* Map will render here */}
    //       </div>
    //     </div>
    //   );
    // };  
    return (
        <div>
          <select onChange={handleDictionaryChange} value={selectedDictionary}>
            <option value="camdatacolor_current">Current</option>
            <option value="camdatacolor_prior60">Past: 60 min ago</option>
            <option value="camdatacolor_future60">Future: 60 min forecast</option>
          </select>
          <div
            ref={mapContainer}
            style={{
              width: '100vw',
              height: '100vh',
              position: 'relative',
            }}
          >
            {/* Map will render here */}
          </div>
        </div>
      );

    };

export default Map;