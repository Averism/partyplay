import path from "path"
import server from "./server"

export default function main():number{
    //put your main logic here
    server();
    return 0;
}

/* istanbul ignore if */
if(process.argv[1] == path.join(process.cwd(),"src","index.ts"))
    main(); 