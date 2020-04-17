import { writable } from 'svelte/store';
import { getMockNtk, NTKStore, CustomNTKStore, NTKPerson } from './ntk.model';


const ntkStore = writable<NTKStore>({
    ntkPersons: getMockNtk()
});

const customNtkStore: CustomNTKStore = {
    subscribe: ntkStore.subscribe,
    onMarkedChanged: (ntkId: string) => {
        console.log('onMarkedChanged', ntkId)
        ntkStore.update(state => {
            const ntkp = state.ntkPersons;
            const foundIndex = ntkp.findIndex((ntkPerson: NTKPerson)=>ntkPerson.ntkDetails.id === ntkId);
            if (foundIndex === -1) {
                throw new Error('No person was found to update')
            }
            ntkp[foundIndex].isMarked = !ntkp[foundIndex].isMarked;

            ntkp.splice(foundIndex, 1, ntkp[foundIndex]);

            return {...state};
        })
    },
}

export default customNtkStore;
