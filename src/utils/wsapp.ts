import Websocket from 'ws'

const decode = (str: string):string => Buffer.from(str, 'base64').toString('binary');
const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');

export class WsappRequest {
    static isWsappRequest(x: any): x is WsappRequest {
        if(typeof x.name == "undefined") return false;
        if(typeof x.parameters != "object" && typeof x.parameters !="undefined") return false;
        return true;
    }
    name: string;
    parameters: any;
}

export type WsappParam = {[key: string]:any};

export abstract class WsappHandler {
    static isWsappHandler(o: any): o is WsappHandler {
        return typeof o.getName == "function" && typeof o.handle == 'function' && typeof o.getSignature == 'function'
    }
    wsreturn(result: any, ws: Websocket) {
        ws.send(JSON.stringify({name: this.getName(), value: result}));
    }
    abstract getSignature(): {[name: string]: {"required": boolean, "type": string, "b64": boolean, "default": any}}
    abstract getResultType(): string;
    abstract handle(param: WsappParam, ws: Websocket): boolean;
    abstract getName(): string;
}

export class Wsapp {
    handler: {[name: string]: WsappHandler} = {};
    handle(msg: string, ws: Websocket): boolean{
        try{
            const data = JSON.parse(msg);
            if(WsappRequest.isWsappRequest(data)){
                if(this.handler[data.name]){
                    let handler = this.handler[data.name];
                    let signature = handler.getSignature();
                    let param: WsappParam = {};
                    for(let paramName in signature){
                        if(signature[paramName].required && typeof data.parameters[paramName] == "undefined") {
                            throw "parameter "+paramName+" is required";
                        }
                        if(data.parameters && typeof data.parameters[paramName] != "undefined"){
                            param[paramName] = data.parameters[paramName];
                            if(signature[paramName].b64) param[paramName] = decode(param[paramName]);
                            if(signature[paramName].type === "string[]") param[paramName] = eval(param[paramName]);
                        }
                        if(data.parameters && typeof data.parameters[paramName] == "undefined" 
                        && typeof signature[paramName].default != "undefined") {
                            param[paramName] = signature[paramName].default;
                        }
                    }
                    handler.handle(param, ws);
                } else {
                    throw "unknown function "+data.name;
                }
                return true;
            }
        }catch(e){
            throw e;
        }
        return false;
    }
}