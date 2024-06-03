import React, { useState, useEffect } from "react";
// import Marker from 'react-leaflet';
import Map from "./Map.js";
// import camlatlonData from "../data/dot_cam_latlon.js";

const App = () => {
    const [state, setState] = useState({ lat: 39, lng: -73, zoom: 4.5 })
    // would add fetch files , data, edit data here
    // state variables
    // add react hooks
    // return is the html part, displaying dashboard
    console.log("testing", state)

    return (
        <div style={{ backgroundColor: "black", padding: "50px" }}>
            {/* <div className="firstdiv"> */}
            <h1>Hello React hi again</h1>;
            <Map state={state} setState={setState}>
            </Map>
            <button onClick={() => setState({ ...state, lng: -30 })}>button</button>
        </div>
    )
};

export default App;