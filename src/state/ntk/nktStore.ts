import { writable, get } from 'svelte/store';
import { NTKStore, CustomNTKStore, NTKPerson, NTKPersonDetails, ApprovalStatus } from './ntk.model';
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
            const ntks = await BLM.getNtks();

            ntkStore.update(state => {
                return {
                    ntkPersons: [...ntks],
                    hasFetched: true
                }
            })
            // const res = await fetch('https://nice-to-know.firebaseio.com/ntkp.json');
            // if (res.ok) {
            //     const data = await res.json();

            //     let ntks: NTKPerson[];

            //     if (data) {
            //         const dataArray = Object.values(data);
            //         ntks = await dataArray[0] as NTKPerson[];
            //     } else {
            //         ntks = await getMockUsers(50);

            //         ntks.forEach((ntk, index)=> {
            //             ntk.ntkDetails.id = uid();
            //         })

            //         await fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
            //             method: 'POST',
            //             body: JSON.stringify(ntks),
            //             headers: {
            //                 'Content-Type': 'application/json'
            //             }

            //         })
            //     }

            //     ntkStore.update(state => {
            //         return {
            //             ntkPersons: [...ntks, ...state.ntkPersons],
            //             hasFetched: true
            //         }
            //     })
            // } else {
            //     throw new Error("Server error");
            // } 

        } catch (err) {
            console.log(err)
        }
    },
    onMarkedChanged: async (ntkId: string) => {
        ntkStore.update(state => {
            const ntkp = state.ntkPersons;
            const foundIndex = ntkp.findIndex((ntkPerson: NTKPerson) => ntkPerson.ntkDetails.id === ntkId);
            if (foundIndex === -1) {
                throw new Error('No person was found to update')
            }
            ntkp[foundIndex].isMarked = !ntkp[foundIndex].isMarked;

            ntkp.splice(foundIndex, 1, ntkp[foundIndex]);

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
    onApprovalChanged: (ntkId: string, isApproved: boolean) => {
        ntkStore.update(state => {
            const ntkp = state.ntkPersons;
            const foundIndex = ntkp.findIndex((ntkPerson: NTKPerson) => ntkPerson.ntkDetails.id === ntkId);
            if (foundIndex === -1) {
                throw new Error('No person was found to update')
            }
            ntkp[foundIndex].approvalStatus = isApproved ? ApprovalStatus.approved : ApprovalStatus.disapproved;

            ntkp.splice(foundIndex, 1, ntkp[foundIndex]);

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
                isMarked: false,
                approvalStatus: ApprovalStatus.pending,
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
