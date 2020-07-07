import { writable, get } from 'svelte/store';
import { LoginStatus, LoginDetails } from './appStatus.model';

const appStatusStore = writable({
    loginStatus: LoginStatus.Pending,
    currentUser: null
});

const customAppStatusStore = {
    subscribe: appStatusStore.subscribe,
    onLogin: (loginDetails: LoginDetails) => {
        appStatusStore.update(state => {
            return {
                loginStatus: loginDetails.status,
                currentUser: loginDetails.currentUser
            }
        })
    },
    onLogout: () => {
        appStatusStore.update(state => {
            return {
                loginStatus: LoginStatus.Pending,
                currentUser: null
            }
        })
    },
    getCurrentUser: () => {
        const store = get(appStatusStore);
        return store.currentUser;
    }
}

export default customAppStatusStore;
