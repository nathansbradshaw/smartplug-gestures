import React, { useRef, useState } from 'react'
import * as tf from "@tensorflow/tfjs"
import * as handpose from "@tensorflow-models/handpose"
import Webcam from "react-webcam"
import * as fp from "fingerpose"
import { birdGesture } from "./bird"
import { weakBirdGesture } from "./weakBird"
// import logo from './logo.svg';
import './App.css';
require('dotenv').config();

function App() {
  const REACT_APP_IFTTT_KEY = process.env.REACT_APP_MAKER_KEY
  console.log(REACT_APP_IFTTT_KEY)
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [handSign, setHandSign] = useState(null);
  let delay = 800;
  let cooldown = 0;

  const runHandpose = async () => {
    const net = await handpose.load();
    console.log("handpose model loaded.");
    console.log(delay);
    setInterval(() => {
      detect(net);
      if(cooldown > 0){
        cooldown--;
      }
      console.log(cooldown);
    }, delay)

  }


  const detect = async (net) => {
    if (typeof webcamRef.current !== "undefined" && webcamRef.current !== null && webcamRef.current.video.readyState === 4 && cooldown === 0) {
      const video = webcamRef.current.video;


      const hand = await net.estimateHands(video);
      console.log(hand);
      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([
          fp.Gestures.ThumbsUpGesture,
          birdGesture,
          weakBirdGesture
        ]);
        const gesture = await GE.estimate(hand[0].landmarks, 8.5);
        if (gesture.gestures !== undefined && gesture.gestures.length > 0) {
          console.log(gesture);
          console.log(gesture.gestures);

          const confidence = gesture.gestures.map(
            (prediction) => prediction.confidence
          );
          const maxConfidence = confidence.indexOf(
            Math.max.apply(null, confidence)
          );
          setHandSign(gesture.gestures[maxConfidence].name);
          // console.log(handSign)
          console.log(gesture.gestures[maxConfidence].name)
          console.log(maxConfidence)
          if ((gesture.gestures[maxConfidence].name === "flip_off" || gesture.gestures[maxConfidence].name === "enoch_flip_off")) {
            console.log("light off")
            cooldown = 5;
            const requestOptions = {
              method: 'POST',
              cors: { origin: "*", },
              // headers: {
              //   'Access-Control-Allow-Origin' : '*'
              // }
            };
            fetch('https://maker.ifttt.com/trigger/light_off/with/key/'+ REACT_APP_IFTTT_KEY, requestOptions)
              .then(response => console.log(response))
              
          } else if (gesture.gestures[maxConfidence].name === "thumbs_up" ) {
            cooldown = 5;
            const requestOptions = {
              method: 'POST',
              cors: {  origin: "*", },
              // headers: {
              //   'Access-Control-Allow-Origin' : '*'
              // }
            };
            fetch('https://maker.ifttt.com/trigger/light_on/with/key/' + REACT_APP_IFTTT_KEY, requestOptions)
              .then(response => console.log(response))
              
          }
        }
      }

      // const ctx = canvasRef.current.getContext("2d");
      // drawHand(hand, ctx)

    }
  }
  runHandpose();
  return (
    <div className="App">
      <header className="App-header">
        <Webcam ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480
          }} />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480
          }}
        />

      </header>
    </div>
  );
}

export default App;
