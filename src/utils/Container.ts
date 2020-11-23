import React from 'react';
import { BaseAppState, StateMapping } from './AppStatesHandler';

export function isStateMapped(x: any): x is StateMapped {return x.statePath instanceof StateMapping}

export interface StateMapped {
    statePath: StateMapping<any>;
}

export class Container<P, S> extends React.Component<P | StateMapped, S> {
    stateMap: StateMapping<P>;

    getProps(): P {
        let p = this.props;
        if (isStateMapped(p)) {
            this.stateMap = p.statePath;
            return p.statePath.getProperty() as P;
        } else
            return this.props as P;
    }
}

export type WithState = {state: BaseAppState}

export class SmartContainer<P extends WithState> extends Container<P, any> {

}
