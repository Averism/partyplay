import path from 'path'
import fs from 'fs'
import options from './options'
import { WsappHandler } from './wsapp';

const templatestring =
`    functionname(parameter: finput){
        this.__call("functionname", parameter);
    }\n\n
`;

const casetemplate =
`                case "functionname": typeof theclient.trigger.onfunctionname(data.value); break;\n`

const templatetrigger = 
`        onfunctionname: (x: foutput)=>any = function(x: foutput):any{console.log("functionname",x)};\n`

function generateInput(fn: WsappHandler){
    let sg = fn.getSignature();
    return "{"+Object.keys(sg).map(x=>x+":"+sg[x].type+";").join("")+"}";
}

function generate(fn: WsappHandler, template: string){
    let sg = fn.getSignature();
    return template.replace('functionname', fn.getName()).replace('functionname', fn.getName())
    .replace('foutput',fn.getResultType()) .replace('foutput',fn.getResultType())
    .replace('finput',generateInput(fn)).replace('finput',generateInput(fn));
}

const url = options.domain+':'+options.port;

let clientSdk = fs.readFileSync(path.join('src','utils','wsapp-client-template')).toString();
clientSdk = clientSdk.replace('/*+domain*/','+"'+url+'"');
let files = fs.readdirSync(path.join("src","wsapp"));
let s = "", t="", c="";
console.log("starting preprocess: found "+files.length+" files in folder")
for(let file of files){
    if(!file.endsWith('.ts')) continue;
    let all = require(path.join('..','wsapp',file.substr(0,file.length-3)));
    for(let key in all){
        let o = all[key];
        if(!WsappHandler.isWsappHandler(o)) continue;
        console.log("preprocessing",file)
        s+=generate(o, templatestring);
        t+=generate(o, templatetrigger);
        c+=generate(o, casetemplate);
    }
}

clientSdk = clientSdk.replace('    /* add proxy here */',s);
clientSdk = clientSdk.replace('    /* add trigger here */',t);
clientSdk = clientSdk.replace('            /* add case here */',c);
if(fs.existsSync(path.join('src','reactapp','lib','wsapp-client.ts'))) 
    fs.unlinkSync(path.join('src','reactapp','lib','wsapp-client.ts'));
fs.writeFileSync(path.join('src','reactapp','lib','wsapp-client.ts'),clientSdk);
