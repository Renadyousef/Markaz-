const express=require('express');

const app=express()
const PORT=5000;

//app routes
app.get('/',(req,res)=>{
    res.send("welcome abroed")
})