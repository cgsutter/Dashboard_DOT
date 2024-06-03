import * as React from 'react';
// import React, { useRef, useEffect } from 'react';
import mapboxgl from '!mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import camdata from "../data/dot_cam_latlon.js";
const token = "pk.eyJ1Ijoia3N1bGlhIiwiYSI6ImNqdWE5a2xmNTAwZG80M213NXF2eW81bzQifQ.LmGPYr2NaoRJXgdHdLs6uA"
mapboxgl.accessToken = token;



export class Map extends React.Component {

    constructor(props) {
        super(props)
        this.mapContainer = React.createRef();
    }


    // work with Kara to add button click
    componentDidMount() {

        console.log(this.props)
        var map = new mapboxgl.Map({
            id: 'map',
            container: this.mapContainer.current,
            style: "mapbox://styles/mapbox/light-v9",
            attributionControl: false,
            center: [this.props.state.lng, this.props.state.lat],
            zoom: this.props.state.zoom
        });
        this.map = map

        // // Load and add your data to the map
        // this.map.on('load', () => {
        //     // Add a marker for each data entry
        //     data.forEach(entry => {
        //         new mapboxgl.Marker()
        //             .setLngLat([entry.lng, entry.lat])
        //             .addTo(this.map);
        //     });
        // });
        // Add navigation control (optional)
        this.map.addControl(new mapboxgl.NavigationControl());
        // Load and add your data to the map
        this.map.on('load', () => {
            // Check if data is an array
            // if (Array.isArray(camdata)) {
            //     // Add a marker for each data entry
            //     camdata.forEach(entry => {
            //         // Create a marker with a red flag icon
            //         new mapboxgl.Marker({ color: 'red' })
            //             .setLngLat([entry.lng, entry.lat])
            //             .setPopup(new mapboxgl.Popup().setText(entry.id))
            //             .addTo(this.map);
            //     });

            if (Array.isArray(camdata)) {
                // Add a marker for each data entry
                camdata.forEach(entry => {
                  // Create a marker with a small red circle
                  const el = document.createElement('div');
                  el.className = 'marker';
                  el.style.background = 'red';
                  el.style.width = '10px';
                  el.style.height = '10px';
                  el.style.borderRadius = '50%'; // Make it a circle
        
                  // Add marker with popup to the map
                  new mapboxgl.Marker(el)
                    .setLngLat([entry.lng, entry.lat])
                    .setPopup(new mapboxgl.Popup().setText(entry.id))
                    .addTo(this.map);
                });
            } else {
                console.error('Data is not an array');
            }
        });


    }
    componentDidUpdate(prevProps) {
        if (this.props.state.lng !== prevProps.state.lng) {
            this.map.setCenter([this.props.state.lng, this.props.state.lat])
        }

    }
    render() {

        return (
            <>
                <div style={{ height: '540px' }} ref={this.mapContainer} />
                {/* <button onClick={() => this.props.setState({ ...this.props.state, lng: -60 })}>button</button> */}
            </>

        )
    }
}

export default Map;