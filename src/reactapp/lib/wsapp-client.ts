class WsappClientTriggers {
    //#!rubah-write-multi defaulttrigger maketriggers(wsmodules)
}

export class WsappClient {

    constructor(){
        const theclient = this;
        this.__initws();
        this.__ws.onmessage = function(event: any) {
            const data = JSON.parse(event.data);
            switch(data.name){
                //#!rubah-write-multi assigntrigger makecases(wsmodules)
            }
        }
        this.__ws.onclose = function(event: any) {
            console.log("connection closed");
            // this.__initws();
        }
    }

    private __initws() {
        this.__ws = new WebSocket(String(
            //#!rubah-write wsurl wsaddresses(options)
        ));
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

    //#!rubah-write-multi wsapi makecallmethods(wsmodules)
    
}

let sdk = new WsappClient();
export default sdk;

if(window) {
    (window as any).wsapp = sdk;
}
