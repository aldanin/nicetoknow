import { NTKPerson, NTKStore } from "../state/ntk/ntk.model";
import { getMockUsers } from "../state/ntk/mock";
import uid from "uid";
import { LoginStatus } from "../state/app/appStatus.model";
import dataStore from "../state/ntk/nktStore";
import customAppStatusStore from "../state/app/appStatusStore";
import { get } from 'svelte/store';

export class BLM {
    static async setAppData() : Promise<void> {
        dataStore.setStoreAsync();
    }
    static async getNtks(): Promise<NTKPerson[]> {
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
            const state: NTKStore = get(dataStore);
            let ntks: NTKPerson[] = state ? state.ntkPersons : [];

            const foundNtk = ntks.find(ntk => ntk.ntkDetails.name === userName);

            if (foundNtk) {
                customAppStatusStore.onLogin({
                    status: LoginStatus.LoggedIn,
                    userName
                })
            } else {
                customAppStatusStore.onLogin({
                    status: LoginStatus.LoginFailed,
                    userName
                })
            }
        } 
        catch (err) {
            throw new Error("server error: " + err.message);
        }

    }
}

