import { writable } from 'svelte/store';
import { getView } from './viewRepo';

const viewStore = writable({
    currentView: getView('login'),
    isGridView: false,
});

const customViewStore = {
    subscribe: viewStore.subscribe,
    setView: ((viewId: string) => {
        viewStore.update(state => {
            return {
                currentView: getView(viewId),
            }
        })
    }),
    isGridViewChanged: ((isGridView: boolean) => { 
        console.log('isGridView', isGridView)
        viewStore.update(state => {
            return {...state, isGridView}
        })
    }),
}

export default customViewStore;
