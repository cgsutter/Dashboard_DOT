import * as React from 'react';
import mapboxgl from '!mapbox-gl';
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
    }
    componentDidUpdate(prevProps){
        if(this.props.state.lng !== prevProps.state.lng){
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