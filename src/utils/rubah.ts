import path from "path";
import fs from "fs";

export class RubahState {

}

const relative = path.relative(__dirname, process.cwd());

const templateRegex = /^(\w+)\((\w*(\s*,\s*\w*)*)\)$/;
function templateParser(template: string): {handle: string, params: string[]} {
    let temp = templateRegex.exec(template);
    if(temp[1]){
        return {handle: temp[1], params: temp[2].split(',').map(x=>x.trim())};
    } else throw `cannot parse ${template}`
}

type KVO = {key: string, value: any};
type RubahCommand = (job: RubahJobs, params: string[])=>Promise<KVO[]>;

export class Rubah {
    constructor (config: RubahOptions){
        this.config = config;
        console.log("reading rubah mapping");
        if(!config.mappingfile || config.mappingfile.length == 0) 
            config.mappingfile = ["rubahmap.json"];
        if(fs.existsSync(path.join(...config.mappingfile))){
            this.state = JSON.parse(fs.readFileSync(path.join(...config.mappingfile)).toString());
        }
        if(config.helpers){
            for(let helper of config.helpers){
                let temp = require('./'+path.join(relative,...helper));
                for(let key of Object.keys(temp)){
                    this.helpers[key] = temp[key];
                }
            }
        }
        console.log(this.helpers);
    }

    config: RubahOptions;
    state: any = {};
    data: any = {};
    helpers: {[key: string]: Function} = {};
    
    iterate(params: string[]): any[][] {
        const rubah: Rubah = this;
        function resolveParams(params: string[], index: number[]): any[] {
            return params.map((x,i)=>Array.isArray(rubah.data[x])?rubah.data[x][i]:rubah.data[x]);
        }
        function next(index: number[], maxIndex: number[]): number[] {
            let nx = Array.from(index);
            nx[nx.length-1] = nx[nx.length-1] + 1 ;
            for(let i = nx.length-1; i>0; i--) if(nx[i] == maxIndex[i]) {
                nx[i] = 0;
                nx[i-1] = nx[i-1] + 1;
            }
            return nx;
        }
        let res: any[][] = [];
        let currentIndex:number[] = params.map(x=>0);
        let maxIndex: number[] = params.map(x=>Array.isArray(rubah.data[x])?this.data[x].length:1);
        while(currentIndex[0] < maxIndex[0]) {
            res.push(resolveParams(params,currentIndex));
            currentIndex = next(currentIndex, maxIndex);
        }
        return res;
    }

    commands: {[key: string]:RubahCommand} = {
        "import-ts": async (job: RubahJobs, params: string[]): Promise<KVO[]> => {
            let res: KVO[] = [];
            if(!Array.isArray(job.location)) throw "import-ts need location params that is an array of string"
            switch(params[0]){
                case 'single':
                    let temp = await import('./'+path.join(relative, ...job.location));
                    if(job.module) temp = temp[job.module];
                    res.push({key: job.name, value: temp});
                    break;
                case 'folder':
                    let temp2: any[] = [];
                    let folder = path.join(...job.location);
                    let files = fs.readdirSync(folder);
                    let regex = job.filter?new RegExp(job.filter):/./;
                    for(let file of files){
                        if(!file.endsWith('.ts')) continue;
                        if(!regex.test(file)) continue;
                        let filename = file.substr(0,file.length-3);
                        let temp = await import('./'+path.join(relative, ...job.location, filename));
                        if(job.module) temp = temp[job.module];
                        temp2.push(temp);
                    }
                    res.push({key: job.name, value: temp2});
                    break;
                default: throw "invalid option for import-ts, expected single or folder, but found: "+params[0];
            }
            return res;
        }, 
        "write": async (job: RubahJobs, params: string[]): Promise<KVO[]> => {
            let nl = job.newline?job.newline:this.config.newline?this.config.newline:"\n";
            switch(params[0]) {
                case 'folder':
                    break;
                case 'single': default:
                    let filename = path.join(...job.location);
                    let file = fs.readFileSync(filename).toString();
                    let lines = file.split(nl);
                    let res: string[] = [];
                    let mode: string = null;
                    for(let line of lines){
                        let left = line.substr(0,line.indexOf(line.trim()));
                        if(line.trim().startsWith('//#!rubah-write')){
                            let multi = false;
                            if(line.trim().startsWith('//#!rubah-write-multi'))
                                multi = true;
                            let parts = line.trim().split(' ');
                            let mapkey = job.name + "-" + parts[1];
                            let template = parts[2];
                            job.rubah.state[mapkey] = line.trim();
                            let {handle, params} = templateParser(template);
                            let body : string[] = [`//#!rubah-generated${multi?'-multi':''} ${mapkey} DO NOT EDIT`];
                            if(job.rubah.helpers[handle]){
                                let p: any[][];
                                if(multi) p = job.rubah.iterate(params);
                                else p = [params.map(x=>job.rubah.data[x])];
                                body = body.concat( p.map(x=>job.rubah.helpers[handle](...x) ).reduce((p,c)=>p.concat(c),[]) );
                            }else throw `unknown helper ${handle} with params ${params}`
                            body.push(`//---${mapkey}`);
                            body = body.map(x=>left+x);
                            res = res.concat(body);
                        } else if(line.trim().startsWith("//#!rubah-generated")){
                            let multi = false;
                            if(line.trim().startsWith('//#!rubah-generated-multi'))
                                multi = true;
                            let mapkey = line.trim().split(' ')[1];
                            mode = mapkey;
                        } else if (mode!=null && line.trim() == "//---"+mode) {
                            mode = null;
                        } else if (mode==null) {
                            res.push(line);
                        }
                    }
                    let mf = path.join(...job.rubah.config.mappingfile);
                    console.log(res.join(nl));
                    fs.writeFileSync(mf,JSON.stringify(job.rubah.state,null,2));
            }
            return [];
        }
    }

    async generate(){
        console.log(`found ${this.config.jobs.length} job${this.config.jobs.length>1?'s':''} executing...`);
        for(let job of this.config.jobs){
            console.log(`executing job ${job.name}`);
            let commands: string[] = job.command.split(" ");
            let handler = commands.shift();
            if(this.commands[handler]){
                job.rubah = this;
                try{
                    let temp: KVO[] = await this.commands[handler](job, commands);
                    for(let o of temp){
                        this.data[o.key] = o.value;
                    }
                }catch(e) {console.error(e)}
            } else {
                console.error(`unknown handler ${handler} with params ${commands}`);
            }
        }
        console.log("rubah finished", this.state)
    }

    revertToTemplate(){

    }
}

export class RubahJobs {
    name: string;
    type: string;
    command: string;
    location?: string;
    module?: string;
    filter?: string;
    newline?: string;
    rubah: Rubah;
}

export class RubahOptions {
    jobs: RubahJobs[];
    mappingfile?: string[] = [];
    newline?: string;
    helpers?: string[][];
}

if(process.argv[1] == path.join(process.cwd(),"src","utils","rubah.ts")) {
    console.log("running rubah");
    console.log("reading rubah config");
    let config: RubahOptions = new RubahOptions();
    config = Object.assign(config, JSON.parse(fs.readFileSync("rubahconfig.json").toString()));
    let rubah: Rubah = new Rubah(config);
    if(process.argv[2] == "revert"){
        rubah.revertToTemplate();
    }else{
        rubah.generate();
    }
}