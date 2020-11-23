import express, { RequestHandler } from 'express'
import expressWsLib from 'express-ws'
import Websocket from 'ws'
import Path from 'path'
import FS from 'fs'
import route from './utils/routes'
import favicon from 'serve-favicon'
import wsapp from './wsapp-server'
import options from './utils/options'
const app = express()
app.use(favicon(Path.join('static','favicon.ico')));
const expressWs = expressWsLib(app);

type returnType = string | FS.ReadStream;

function isStream(x: returnType): x is FS.ReadStream {
    return x instanceof FS.ReadStream
}

function getFile(filename: string): returnType {
    if (/\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/.test(filename)) {
        return FS.createReadStream(Path.join('static',filename));
    }
    return FS.readFileSync(Path.join('static',filename)).toString()
}

expressWs.app.ws('/wsrpc', function (ws: Websocket, req: express.Request) {
    ws.on('message', function (msg: string) {
        try{
            wsapp.handle(msg,ws);
        }catch (e){
            console.error(e);
            ws.send(JSON.stringify({type: "ERROR", error: e}));
        }
    });
});

app.get('*', function (req: express.Request, res: express.Response) {
    let f = route(req.url);
    if(f != null){
        let body = getFile(f);
        if(isStream(body)){
            body.pipe(res);
        }else{
            res.send(body);
        }
    } else {
        res.sendStatus(404);
    }
})

export default function start() {
    app.listen(options.port, () => {
        console.log(`PartyPlay app listening at http://${options.domain}:${options.port}`)
    })
}

