import {WsappHandler, WsappParam} from '../utils/wsapp';
import path from "path"
import fs from "fs"

class ListFile extends WsappHandler {
    getResultType(): string {
        return "{path: string[], items: string[]}"
    }
    getName(): string {
        return "listfile";
    }
    
    getSignature(): { [name: string]: { required: boolean; type: string; b64: boolean; default: any}; } {
        return {
            path: {
                required: false,
                type: "string[]",
                b64: false,
                default: ['.']
            }
        }
    }
    
    handle(param: WsappParam, ws: import("ws")): boolean {
        let listpath: string[] = param.path;
        this.wsreturn({path: listpath, items: fs.readdirSync(path.join(...listpath))},ws);
        return true;
    }
}

export let listfile = new ListFile();