import { writable, get } from 'svelte/store';
import { NTKStore, CustomNTKStore, NTKPerson, NTKPersonDetails } from './ntk.model';
import {getMockNtk, getMockUsers} from './mock';
import uid from 'uid';

// TODO https://nice-to-know.firebaseio.com/
const ntkStore = writable<NTKStore>({
    ntkPersons: [],
    hasFetched: false
});

const customNtkStore: CustomNTKStore = {
    subscribe: ntkStore.subscribe, 
    isEmpty: () => {
        const store = get(ntkStore);
        return !store.hasFetched;
    },
    setStoreAsync: async () => {
        try {
            const res = await fetch('https://nice-to-know.firebaseio.com/ntkp.json');
            if (res.ok) {
                const ntks = await res.json();
    
                ntkStore.update(state => {
                    return {
                        ntkPersons: [...ntks, ...state.ntkPersons],
                        hasFetched: true
                    }
                })
            } else {
                throw new Error("Server error");
            }
            
        } catch(err) {
            console.log(err)
        }  
    },
    onMarkedChanged:  async (ntkId: string) => {
        ntkStore.update(state => {
            const ntkp = state.ntkPersons;
            const foundIndex = ntkp.findIndex((ntkPerson: NTKPerson) => ntkPerson.ntkDetails.id === ntkId);
            if (foundIndex === -1) {
                throw new Error('No person was found to update')
            }
            ntkp[foundIndex].isMarked = !ntkp[foundIndex].isMarked;

            fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
                method: 'POST',
                body: JSON.stringify(ntkp),
                headers: {
                    'Content-Type': 'application/json'
                }
              
            })

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
