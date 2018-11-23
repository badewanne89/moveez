import React from "react";
import ReactDOM from "react-dom";

import sBackgroundImageUrl from "./welcome_background.png";


const Background = ()=>{
    return (
        <div style={{width: "100%", height:"500px", backgroundImage:`url(${sBackgroundImageUrl})`, backgroundSize:"cover"}}/>
    );
}

ReactDOM.render(
    <Background/>,
    document.getElementById('reactRoot')
)
