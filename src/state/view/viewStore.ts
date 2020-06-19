import { writable } from 'svelte/store';
import { getView } from './viewRepo';

const viewStore = writable({
    currentView: getView('login'),
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
}

export default customViewStore;
