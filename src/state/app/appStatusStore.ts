import { writable } from 'svelte/store';
import { LoginStatus, LoginDetails } from './appStatus.model';

const appStatusStore = writable({
    loginStatus: LoginStatus.Pending
});

const customAppStatusStore = {
    subscribe: appStatusStore.subscribe,
    onLogin: (loginDetails: LoginDetails) => {
        appStatusStore.update(state => {
            return {
                loginStatus: loginDetails.status,
            }
        })
    },
    onLogout: () => {
        appStatusStore.update(state => {
            return {
                loginStatus: LoginStatus.Pending ,
            }
        })
    }
}

export default customAppStatusStore;
