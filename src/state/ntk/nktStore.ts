import { writable, get } from 'svelte/store';
import { NTKStore, CustomNTKStore, NTKPerson, NTKPersonDetails, ConnectionStatus, ConnectionDetails } from './ntk.model';
import { getMockNtk, getMockUsers } from './mock';
import uid from 'uid';
import { BLM } from '../../BLM/BLM';

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
            console.log('setStoreAsync')
            const ntks = await BLM.fetchNtks();

            ntkStore.update(state => {
                return {
                    ntkPersons: [...ntks],
                    hasFetched: true
                }
            })
        } catch (err) {
            console.log(err)
        }
    },
    onMarkedChanged: async (fromNtkId: string) => {
        ntkStore.update(state => {
            const ntkp = [...state.ntkPersons];
            const foundIndex = ntkp.findIndex((ntkPerson: NTKPerson) => ntkPerson.ntkDetails.id === fromNtkId);
            if (foundIndex === -1) {
                throw new Error('No person was found to update')
            }

            const fromPerson = ntkp[foundIndex];
            const me = BLM.getCurrentUser();

            fromPerson.toApproveList = fromPerson.toApproveList || [];
            const foundItem = fromPerson.toApproveList.find(item=>item.id ===me.ntkDetails.id)

            if (foundItem) {
                fromPerson.toApproveList = fromPerson.toApproveList.filter(item=>item.id !==me.ntkDetails.id);
                me.fromApproveList = me.fromApproveList.filter(item=>item.id !==fromNtkId)
            } else {
                fromPerson.toApproveList.push({
                    connectionStatus: ConnectionStatus.pending,
                    id: me.ntkDetails.id
                });
    
                me.fromApproveList =  me.fromApproveList || [];
                me.fromApproveList.push({
                    connectionStatus: ConnectionStatus.pending,
                    id: fromNtkId
                })
            }
           

            fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(() => {
                fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
                    method: 'POST',
                    body: JSON.stringify(ntkp),
                    headers: {
                        'Content-Type': 'application/json'
                    }

                })
            })

            return { ntkPersons: ntkp, hasFetched: state.hasFetched };
        })
    },
    onApprovalChanged: (toNtkId: string, isApproved: boolean) => {
        ntkStore.update(state => {
            const ntkp = state.ntkPersons;
            const foundIndex = ntkp.findIndex((ntkPerson: NTKPerson) => ntkPerson.ntkDetails.id === toNtkId);
            if (foundIndex === -1) {
                throw new Error('No person was found to update')
            }

            const currentPerson = BLM.getCurrentUser();
            const otherPerson = ntkp[foundIndex];

            //Update other person with what the current person did with his friendship request:
            const otherPersonFromApprovalDetails =
                otherPerson.fromApproveList.find((details: ConnectionDetails) => details.id === currentPerson.ntkDetails.id);
            otherPersonFromApprovalDetails.connectionStatus =
                isApproved ? ConnectionStatus.resolved : ConnectionStatus.rejected;

            // Update current Perons with the same details in his to list:
            const curentPersonToApprovalDetails =
                currentPerson.toApproveList.find((details: ConnectionDetails) => details.id === toNtkId);
            curentPersonToApprovalDetails.connectionStatus =
                isApproved ? ConnectionStatus.resolved : ConnectionStatus.rejected;

            fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(() => {
                fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
                    method: 'POST',
                    body: JSON.stringify(ntkp),
                    headers: {
                        'Content-Type': 'application/json'
                    }

                })
            })

            return { ...state };
        })
    },
    registerUser: (user: NTKPersonDetails) => {
        ntkStore.update(state => {
            const ntkp = state.ntkPersons;
            const newNTK: NTKPerson = {
                ntkDetails: { ...user, id: uid() },
                toApproveList: [],
                fromApproveList: [],
            }
            ntkp.push(newNTK);    

            fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(() => {
                fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
                    method: 'POST',
                    body: JSON.stringify(ntkp),
                    headers: {
                        'Content-Type': 'application/json'
                    }

                })
            })

            return { ...state };
        })
    },
    updateStore: (newState) => {
        ntkStore.update(() => {
            return newState
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
