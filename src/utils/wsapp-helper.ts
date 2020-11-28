import {WsappHandler} from "./wsapp";

export function makecases(module: {[key: string]: WsappHandler}){
    return Object.keys(module).map(x=>
        `case "${module[x].getName()}": theclient.trigger.${module[x].getName()}(data.value); break;`)
    
}

export function maketriggers(module: {[key: string]: WsappHandler}){
    return Object.keys(module).map(x=>
        `on${module[x].getName()}: (x: ${module[x].getResultType()})=>any = function(x: ${
            module[x].getResultType()}):any{console.log("${module[x].getName()}",x)};`)
}

export function wsaddresses(option: any){
    return [`"ws://${option.domain}:${option.port}/wsrpc"`]
}

export function makecallmethods(module: {[key: string]: WsappHandler}){
    return Object.keys(module).map(x=>
        [`${module[x].getName()}(parameter: ${generateInput(module[x])}){`,
    `   this.__call("${module[x].getName()}", parameter);`,
    `}`]).reduce((p,c)=>p.concat(c),[]);
}

function generateInput(fn: WsappHandler){
    let sg = fn.getSignature();
    return ["{"+Object.keys(sg).map(x=>x+":"+sg[x].type+";").join("")+"}"];
}