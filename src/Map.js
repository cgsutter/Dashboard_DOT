// import * as React from 'react';
import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import camdata from "../data/dot_cam_latlon.js";
import camdatacolor from "../data/dot_cam_latlon_color_current.js";
import { api_token_mapbox } from '../credentials.js';
// const token = MY_CONSTANT
mapboxgl.accessToken = api_token_mapbox;



const Map = (props) => {
    const mapContainer = useRef(null);
    const { state } = props;
    // const [toggle, setToggle] = useState(true); // Add a state variable for the toggle

    console.log("PRINT COLOR")
    console.log(camdatacolor['Skyline_5996'])
    

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
                el.style.background = camdatacolor[(entry.id)];
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
    }, [state]);

    useEffect(() => {
        if (mapContainer.current && props.state.lng && props.state.lat) {
            mapContainer.current.style.height = '750px'; 
        }
    }, [mapContainer, props.state.lng, props.state.lat]);

    return (
        <div
          ref={mapContainer}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Map will render here */}
        </div>
      );
    };
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

export default Map;