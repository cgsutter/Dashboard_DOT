import React, { useState, useEffect } from "react";
// import Marker from 'react-leaflet';
import Map from "./Map.js";
// import camlatlonData from "../data/dot_cam_latlon.js";

const App = () => {
    const [state, setState] = useState({ lat: 42.5, lng: -76, zoom: 6 })
    // would add fetch files , data, edit data here
    // state variables
    // add react hooks
    // return is the html part, displaying dashboard
    console.log("testing", state)

    return (
        <div style={{ backgroundColor: "grey", padding: "10px" , height: "500vh" }}>
            {/* <div className="firstdiv"> */}
            <h1>Road Surface Predictions for March 23, 2024 at 5pm EST</h1>
            <Map state={state} setState={setState}>
            </Map>
            <button onClick={() => setState({ ...state, lng: -30 })}>button</button>
        </div>
    )
};

export default App;