// import * as React from 'react';
import React, { useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import camdata from "../data/dot_cam_latlon.js";
import { api_token_mapbox } from '../credentials.js';
// const token = MY_CONSTANT
mapboxgl.accessToken = api_token_mapbox;


const Map = (props) => {
    const mapContainer = useRef(null);
    const { state } = props;

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v9',
            attributionControl: false,
            center: [state.lng, state.lat],
            zoom: state.zoom
        });

        // Add navigation control
        map.addControl(new mapboxgl.NavigationControl());

        // Add markers
        if (Array.isArray(camdata)) {
            camdata.forEach(entry => {
                const el = document.createElement('div');
                el.className = 'marker';
                el.style.background = 'red';
                el.style.width = '10px';
                el.style.height = '10px';
                el.style.borderRadius = '50%';

                new mapboxgl.Marker(el)
                    .setLngLat([entry.lng, entry.lat])
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
            mapContainer.current.style.height = '540px';
        }
    }, [mapContainer, props.state.lng, props.state.lat]);

    return <div ref={mapContainer} />;
};

export default Map;