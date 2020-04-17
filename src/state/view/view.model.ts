import { Unsubscriber } from "../state.model";

export type View = any;

export type ViewStore = {
    currentView: View
}


export interface CustomViewStore {
    subscribe: (state: ViewStore) => Unsubscriber,
    onViewChanged: (viewId: string) => void;

}
