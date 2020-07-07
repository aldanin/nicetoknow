import { Unsubscriber } from "../state.model";

export type View = any;

export type ViewStore = {
    currentView: View,
    isGridView: boolean,
}


export interface CustomViewStore {
    subscribe: (state: ViewStore) => Unsubscriber,
    onViewChanged: (viewId: string) => void;
    isGridViewChanged: (isGridView: boolean) => void,
}
