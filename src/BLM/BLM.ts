import { NTKPerson, NTKStore, NTKPersonDetails, ApprovalStatus } from "../state/ntk/ntk.model";
import { getMockUsers } from "../state/ntk/mock";
import uid from "uid";
import { LoginStatus, CustomAppStatusStore } from "../state/app/appStatus.model";
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
                    ntks = await getMockUsers(50);

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
            let ntks = BLM.getNtks();

            const foundNtk = ntks.find(ntk => ntk.ntkDetails.name === userName);

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
            const currentUser = customAppStatusStore.getCurrentUser();
            console.log('==>currentUser', currentUser)
            return currentUser;
        } catch (err) {
            console.error(err)
        }
    }

    static register(newUser: NTKPersonDetails) {
        const state: NTKStore = get(dataStore);
        let ntks: NTKPerson[] = state ? state.ntkPersons : [];

        const newNTK: NTKPerson = {
            ntkDetails: { ...newUser, id: uid() },
            isMarked: false,
            approvalStatus: ApprovalStatus.pending,
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

    static getNtks() : NTKPerson[] {
        const state: NTKStore = get(dataStore);
        return state.ntkPersons || [];
    }

    static getMyNtks(): NTKPerson[] {
        const currentUser = BLM.getCurrentUser();
        const allNkts  = BLM.getNtks();

        const myNtks = allNkts.filter(ntk => ntk.ntkDetails.id !== currentUser.ntkDetails.id && ntk.isMarked);

        return myNtks;
    }

    static getNtksToApprove(): NTKPerson[] {
        const currentUser = BLM.getCurrentUser();
        const allNkts  = BLM.getNtks();

        const myNtks = allNkts.filter(ntk => ntk.ntkDetails.id !== currentUser.ntkDetails.id && ntk.isMarked);

        return allNkts;
    }
}

