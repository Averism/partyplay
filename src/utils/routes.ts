import path from 'path'
import fs from 'fs'

const route: {[key: string]: string} = {
    '/': 'index.html'
}

function defRoute(req: string): string {
    let p = req.substr(1);
    if(route[req]) return route[req]; 
    let paths: string[] = p.split("/");
    if(fs.existsSync(path.join("static",...paths))) return path.join(...paths);
    return null;
}

export default defRoute