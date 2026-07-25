import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {

getDatabase,

ref,

set

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { firebaseConfig } from "./firebase.js";

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const speedText = document.getElementById("speed");

const joystick = nipplejs.create({

zone: document.getElementById("zone"),

mode:"static",

position:{

left:"50%",

top:"50%"

},

color:"blue"

});

joystick.on("move",(evt,data)=>{

if(!data)return;

let x=data.vector.x;

let speed=Math.round(x*100);

if(speed>100)speed=100;

if(speed<-100)speed=-100;

speedText.innerHTML=speed;

set(ref(db,"servo"),{

speed:speed

});

});

joystick.on("end",()=>{

speedText.innerHTML=0;

set(ref(db,"servo"),{

speed:0

});

});
