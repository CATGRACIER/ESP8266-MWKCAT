const slider=document.getElementById("slider");
const value=document.getElementById("value");

slider.oninput=()=>{

value.innerHTML=slider.value;

}
