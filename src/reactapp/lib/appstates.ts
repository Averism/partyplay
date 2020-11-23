import { AppStatesHandler, BaseAppState, map, StateMapping } from "../../utils/AppStatesHandler";

export class AppStates extends BaseAppState {
}

let realAppStates: AppStates = new AppStates();
export let appStates: AppStates = new Proxy(realAppStates,new AppStatesHandler<AppStates>());

export default appStates;




