declare global {
    interface Window { wsapp: WsappClient; }
}

class WsappClientTriggers {

}

export class WsappClient {

    constructor(){
        const theclient = this;
        this.__initws();
        this.__ws.onmessage = function(event: any) {
            const data = JSON.parse(event.data);
            switch(data.name){

            }
        }
        this.__ws.onclose = function(event: any) {
            console.log("connection closed");
            // this.__initws();
        }
    }

    private __initws() {
        this.__ws = new WebSocket("ws://"+"192.168.100.9:3000"+"/wsrpc");
    }

    private __ws: WebSocket;

    private async __call(name: string, parameters: any){
        const ws = this.__ws;
        await new Promise((v,j)=>{
            function waitReady(){
                if(ws.readyState == ws.CONNECTING){
                    setTimeout(waitReady,100);
                }else{
                    v();
                }
            }
            waitReady();
        })
        this.__ws.send(JSON.stringify({name, parameters}))
    }

    trigger: WsappClientTriggers = new WsappClientTriggers();

    defaultHandler: (data: any)=>any = function(data: any){
        console.log(data);
    }


    
}

let sdk = new WsappClient();
export default sdk;

const w: Window = (window as Window);
if(w) {
    w.wsapp = sdk;
}
