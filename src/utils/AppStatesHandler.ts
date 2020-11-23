import React from "react"

export class BaseAppState{
    __instance: React.Component;

    __setInstance(instance: React.Component): void {
        this.__instance = instance;
    }

    __update(){
        this.__instance.setState(this);
    }
}

export class StateMapping<T>{
    constructor(stateMap: string, state?: BaseAppState){
        this.stateMap = stateMap.split(".");
        this.state = state;
    }
    stateMap: string[];
    state: BaseAppState;
    getProperty(target?: any, depth: number = 0): T{
        if(typeof target == "undefined") target = this.state;
        if(depth==this.stateMap.length-1) return target[this.stateMap[depth]] as T;
        else return this.getProperty(target[this.stateMap[depth]],depth+1)
    }
    forPath<P>(stateMap: string):StateMapping<P>{
        return new StateMapping<P>(stateMap,this.state);
    }
    appendPath<P>(stateMap: string):StateMapping<P>{
        return new StateMapping<P>([...this.stateMap,stateMap].join("."),this.state);
    }
}

export class StateMapAction<T> {
    constructor(map: StateMapping<T>, state?: BaseAppState) {
        this.map = map;
        if(state) this.state = state;
        else if (map.state) this.state = map.state;
    }
    map: StateMapping<T>;
    state: BaseAppState;
    getState():T{
        return this.map.getProperty(this.state) as T;    
    }
    _getFunc(name: string){
        return ((this as any)[name] as Function).bind(this);
    }
}

class  AppStatesChildHandler implements ProxyHandler<any> {
    __instance: any;
    __ancestor: BaseAppState;

    constructor(ancestor: BaseAppState){
        this.__ancestor = ancestor;
        this.__instance = ancestor.__instance;
    }

    get(target: any, p: PropertyKey, receiver: any) {
        let res = target[p];
        if (typeof res == "undefined")
            res = Object.getPrototypeOf(target)[p];
        if (typeof res == "function")
            res = res.bind(target);
        if (typeof res == "object")
            res = new Proxy(res, new AppStatesChildHandler(this.__ancestor))
        return res;
    }
    set(target: any, p: PropertyKey, value: any, receiver: any): boolean {
        (target as any)[p] = value;
        if (this.__instance && typeof this.__instance.setState == "function") 
            this.__ancestor.__update();
        return true;
    }
}

export class AppStatesHandler<T extends BaseAppState> implements ProxyHandler<T> {
    get(target: T, p: PropertyKey, receiver: any) {
        let res = (target as any)[p];
        if (typeof res == "undefined")
            res = Object.getPrototypeOf(target)[p];
        if (typeof res == "function")
            res = res.bind(target);
        if (typeof res == "object")
            res = new Proxy(res, new AppStatesChildHandler(target));
        return res;
    }
    set(target: T, p: PropertyKey, value: any, receiver: any): boolean {
        (target as any)[p] = value;
        if (target.__instance) target.__update();
        return true;
    }
}

export function map<T>(path: string,appState: BaseAppState):StateMapping<T> {
    return new StateMapping<T>(path,new Proxy(appState,new AppStatesHandler<BaseAppState>()));
}
