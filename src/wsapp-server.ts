import {Wsapp, WsappHandler} from "./utils/wsapp"
import path from 'path'
import fs from 'fs'

let wsapp = new Wsapp();

let files = fs.readdirSync(path.join("src","wsapp"));
for(let file of files){
    if(!file.endsWith('.ts')) continue;
    let all = require('./wsapp/'+file.substr(0,file.length-3));
    for(let key in all){
        let o = all[key];
        if(!WsappHandler.isWsappHandler(o)) continue;
        console.log('registering handler '+o.getName());
        wsapp.handler[o.getName()] = o;
    }
}

export default wsapp;