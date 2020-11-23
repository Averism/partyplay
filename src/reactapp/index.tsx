import React from "react";
import ReactDOM from "react-dom";
import appState, { AppStates } from "./lib/appstates";
import wsapp from "./lib/wsapp-client";
let appInstance: App;

class App extends React.Component<AppStates, AppStates> {
    constructor(props: AppStates) {
        super(props);
        this.state = appState;
        appState.__setInstance(this);
        appInstance = this;
    }

    componentDidMount(){
        onAppMount();
    }

    render(): React.ReactNode {
        let r = <div>Your main page here</div>
        // r = toolbar(r);
        return r;
    }
}

Error.stackTraceLimit = undefined;
const app = React.createElement(App,appState);
ReactDOM.render(app, document.getElementById('root'));

function onAppMount() {
    (window as any).appstate = appState;
    wsapp.defaultHandler = function(data: any){
        window.alert(data.toString());
    }
    //main control logic here
}

window.onresize = function(){appState.__update()}
window.ondeviceorientation = function(){appState.__update()}