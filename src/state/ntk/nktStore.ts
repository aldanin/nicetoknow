import { writable, get } from 'svelte/store';
import { NTKStore, CustomNTKStore, NTKPerson, NTKPersonDetails, ConnectionStatus, ConnectionDetails } from './ntk.model';
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

            fromPerson.approvalList = fromPerson.approvalList || [];
            const foundItem = fromPerson.approvalList.find(item => item.id === me.ntkDetails.id)

            if (foundItem) {
                fromPerson.approvalList = fromPerson.approvalList.filter(item => item.id !== me.ntkDetails.id);
                me.approvalList = me.approvalList.filter(item => item.id !== fromNtkId)
            } else {
                fromPerson.approvalList.push({
                    connectionStatus: ConnectionStatus.pending,
                    id: me.ntkDetails.id,
                    isTo: true
                });

                me.approvalList = me.approvalList || [];
                me.approvalList.push({
                    connectionStatus: ConnectionStatus.pending,
                    id: fromNtkId,
                    isTo: false
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
            const ntkp = [...state.ntkPersons];
            const currentPerson = BLM.getCurrentUser();
            const otherPerson = ntkp.find((ntkPerson: NTKPerson) => ntkPerson.ntkDetails.id === toNtkId);
            if (!otherPerson) {
                throw new Error('No person was found to update')
            }

            const curentPersonToApprovalDetails =
                currentPerson.approvalList.find((details: ConnectionDetails) => details.id === toNtkId && details.isTo);
            const otherPersonFromApprovalDetails =
                otherPerson.approvalList.find((details: ConnectionDetails) => details.id === currentPerson.ntkDetails.id && !details.isTo);

            curentPersonToApprovalDetails.connectionStatus = isApproved ? ConnectionStatus.connected : ConnectionStatus.rejected;
            otherPersonFromApprovalDetails.connectionStatus = isApproved ? ConnectionStatus.connected : ConnectionStatus.rejected;

            // if (isApproved) {
            //     curentPersonToApprovalDetails.connectionStatus = ConnectionStatus.connected;
            //     otherPersonFromApprovalDetails.connectionStatus = ConnectionStatus.connected;

            //     // otherPerson.connectedNtks = otherPerson.connectedNtks || [];
            //     // currentPerson.connectedNtks = currentPerson.connectedNtks || [];
            //     // // Add the new connected id to the to list and the cutrrent list
            //     // otherPerson.connectedNtks.push(currentPerson.ntkDetails.id);
            //     // currentPerson.connectedNtks.push(toNtkId);
            //     // // Remove the now-resolved approvals from the 2 related lists
            //     // otherPerson.approvalList = otherPerson.approvalList.filter(item => item.id !== otherPersonFromApprovalDetails.id);
            //     // currentPerson.approvalList = currentPerson.approvalList.filter(item => item.id !== curentPersonToApprovalDetails.id);
            // } else {
            //     //Update other person the outcome -rejection
            //     otherPersonFromApprovalDetails.connectionStatus = ConnectionStatus.rejected;
            //     // Update current Perons with the outcome -rejection
            //     curentPersonToApprovalDetails.connectionStatus = ConnectionStatus.rejected
            // }

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
    registerUser: (user: NTKPersonDetails) => {
        ntkStore.update(state => {
            const ntkp = state.ntkPersons;
            const newNTK: NTKPerson = {
                ntkDetails: { ...user, id: uid() },
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

export default customNtkStore;
