import React, { useState, useEffect } from "react";
import Map from "./Map.js";
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
            <Map state={state} setState={setState} />
            {/* could move button here rather than map.js */}
            <button onClick={() => setState({ ...state, lng: -30 })}>button</button>
        </div>
    )
};

export default App;