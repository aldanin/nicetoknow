import { NTKPerson, NTKStore, NTKPersonDetails, ConnectionStatus } from "../state/ntk/ntk.model";
import { getMockUsers } from "../state/ntk/mock";
import uid from "uid";
import { LoginStatus } from "../state/app/appStatus.model";
import dataStore from "../state/ntk/nktStore";
import customAppStatusStore from "../state/app/appStatusStore";
import { get } from 'svelte/store';

export class BLM {
    static async setAppData(): Promise<void> {
        dataStore.setStoreAsync();
    }
    static async fetchNtks(): Promise<NTKPerson[]> {
        try {
            const res = await fetch('https://nice-to-know.firebaseio.com/ntkp.json');
            if (res.ok) {
                const data = await res.json();

                let ntks: NTKPerson[];

                if (data) {
                    const dataArray = Object.values(data);
                    ntks = await dataArray[0] as NTKPerson[];
                } else {
                    ntks = await getMockUsers(150);

                    ntks.forEach((ntk, index) => {
                        ntk.ntkDetails.id = uid();
                    })

                    await fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
                        method: 'POST',
                        body: JSON.stringify(ntks),
                        headers: {
                            'Content-Type': 'application/json'
                        }

                    })

                }

                return ntks;

            } else {
                throw new Error("Server error");
            }

        } catch (err) {
            console.log(err)
        }
    }

    static async login(userName: string) {
        try {
            let ntks = BLM.getNtks(true);

            const foundNtk = ntks.find(ntk => ntk.ntkDetails.name === userName.trim());

            if (foundNtk) {
                customAppStatusStore.onLogin({
                    status: LoginStatus.LoggedIn,
                    currentUser: foundNtk
                })
            } else {
                customAppStatusStore.onLogin({
                    status: LoginStatus.LoginFailed,
                    currentUser: null
                })
            }
        }
        catch (err) {
            throw new Error("server error: " + err.message);
        }

    }

    static getCurrentUser(): NTKPerson {
        try {
            let ntks = BLM.getNtks(true);
            const currentUser: NTKPerson = customAppStatusStore.getCurrentUser();
            return currentUser ? ntks.find(ntk => ntk.ntkDetails.id === currentUser.ntkDetails.id) : null;
        } catch (err) {
            console.error(err)
        }
    }

    static register(newUser: NTKPersonDetails) {
        const state: NTKStore = get(dataStore);
        let ntks: NTKPerson[] = state ? state.ntkPersons : [];

        const newNTK: NTKPerson = {
            ntkDetails: { ...newUser, id: uid() },
        }
        ntks.push(newNTK);

        console.log('register, ntks', ntks)

        fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }

        }).then(() => {
            fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
                method: 'POST',
                body: JSON.stringify(ntks),
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(() => {
                console.log('register themn, ntks', ntks)
                dataStore.updateStore({
                    hasFetched: state.hasFetched,
                    ntkPersons: ntks
                });

                customAppStatusStore.onLogin({
                    status: LoginStatus.LoggedIn,
                    currentUser: newNTK
                })

            });
        })
    }

    static logout() {
        customAppStatusStore.onLogout()
    }

    static getNtks(getFullList: boolean = false): NTKPerson[] {
        const state: NTKStore = get(dataStore);
        const ntkPersons = state.ntkPersons || [];
        const finalNtks = !getFullList && state.searchText && state.searchText.length > 1
            ? ntkPersons.filter(ntk => {
                const result = ntk.ntkDetails.name.toLowerCase().includes(state.searchText.toLowerCase())
                return result;
            })
            : ntkPersons;

        return finalNtks;
    }

    static getOtherNtks(): NTKPerson[] {
        let ntks = BLM.getNtks();
        const currentUser: NTKPerson = customAppStatusStore.getCurrentUser();
        return currentUser ? ntks.filter(ntk => ntk.ntkDetails.id !== currentUser.ntkDetails.id) : null;
    }

    static getMyNtks(): NTKPerson[] {
        const currentUser = BLM.getCurrentUser();
        const allNkts = BLM.getNtks();
        const myNtks = currentUser.approvalList
            ? currentUser.approvalList.map(item => {
                return allNkts.find(ntk => ntk.ntkDetails.id === item.id
                    && (item.connectionStatus === ConnectionStatus.connected ||
                        item.connectionStatus === ConnectionStatus.pending && !item.isTo));
            })
            : [];

        return myNtks.filter(ntk => !!ntk);
    }

    static getToNtks(): NTKPerson[] {
        const currentUser = BLM.getCurrentUser();
        const allNkts = BLM.getNtks(true);

        const toNtks = allNkts.filter(ntk =>
            currentUser.approvalList && currentUser.approvalList.find(
                item => item.id === ntk.ntkDetails.id &&
                    item.isTo &&
                    item.connectionStatus === ConnectionStatus.pending
            ));

        return toNtks;
    }
    static getCloneNtkPerson(ntkPerson: NTKPerson): NTKPerson {
        const clone = JSON.parse(JSON.stringify(ntkPerson));
        return clone;
    }

    static updateUserDetails(userDetails: NTKPersonDetails) {
        const state: NTKStore = get(dataStore);
        let ntks: NTKPerson[] = state ? state.ntkPersons : [];

        const currentUser = BLM.getCurrentUser();

        currentUser.ntkDetails = userDetails;


        fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }

        }).then(() => {
            fetch('https://nice-to-know.firebaseio.com/ntkp.json', {
                method: 'POST',
                body: JSON.stringify(ntks),
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(() => {
                console.log('register themn, ntks', ntks)
                dataStore.updateStore({
                    hasFetched: state.hasFetched,
                    ntkPersons: ntks
                });

                customAppStatusStore.onLogin({
                    status: LoginStatus.LoggedIn,
                    currentUser: currentUser
                })

            });
        })
    }

    static onSearchChanged(searchText: string) {
        dataStore.updateStore({
            searchText
        })
    }
}