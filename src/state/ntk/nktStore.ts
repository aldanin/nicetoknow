import { writable, get } from 'svelte/store';
import { NTKStore, CustomNTKStore, NTKPerson, NTKPersonDetails } from './ntk.model';
import {getMockNtk, getMockUsers} from './mock';
import uid from 'uid';


const ntkStore = writable<NTKStore>({
    ntkPersons: [],
});

const customNtkStore: CustomNTKStore = {
    subscribe: ntkStore.subscribe,
    isEmpty: () => {
        const store = get(ntkStore);
        return store.ntkPersons.length === 0;
    },
    setStoreAsync: () => {
        getMockUsers(100).then(ntks => {
            ntkStore.set({
                ntkPersons: ntks
            })
        })
    },
    onMarkedChanged: (ntkId: string) => {
        ntkStore.update(state => {
            const ntkp = state.ntkPersons;
            const foundIndex = ntkp.findIndex((ntkPerson: NTKPerson) => ntkPerson.ntkDetails.id === ntkId);
            if (foundIndex === -1) {
                throw new Error('No person was found to update')
            }
            ntkp[foundIndex].isMarked = !ntkp[foundIndex].isMarked;

            ntkp.splice(foundIndex, 1, ntkp[foundIndex]);

            return {...state};
        })
    },
    onApprovalChanged: (ntkId: string, isApproved: boolean) => {
        ntkStore.update(state => {
            const ntkp = state.ntkPersons;
            const foundIndex = ntkp.findIndex((ntkPerson: NTKPerson) => ntkPerson.ntkDetails.id === ntkId);
            if (foundIndex === -1) {
                throw new Error('No person was found to update')
            }
            ntkp[foundIndex].isApproved = isApproved;

            ntkp.splice(foundIndex, 1, ntkp[foundIndex]);

            return {...state};
        })
    },
    registerUser: (user: NTKPersonDetails) => {
        ntkStore.update(state => {
            const ntkp = state.ntkPersons;
            const newNTK: NTKPerson  = {
                ntkDetails: {...user, id: uid()},
                isMarked: false,
                isApproved: false,
            }
            ntkp.push(newNTK);

            return {...state};
        })
    }
}

// export function getMyNtks(): NTKPerson[] {
//     const store = get(ntkStore);
//     const ntks = store.ntkPersons.filter((ntk: NTKPerson) => {
//         return ntk.isMarked
//     })
//     return ntks
// }
//
// export function getNtks(): NTKPerson[] {
//     const store = get(ntkStore);
//     const ntks = store.ntkPersons.filter((ntk: NTKPerson) => {
//         return !ntk.isMarked
//     })
//     return ntks
// }

export default customNtkStore;
