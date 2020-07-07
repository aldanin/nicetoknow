import { Unsubscriber } from "../state.model"
import { NTKPerson } from "../ntk/ntk.model"

export type LoginDetails = {
    status: LoginStatus,
    currentUser?: NTKPerson
}

export enum LoginStatus  {
    Pending = 1,
    LoggedIn = 2,
    LoginFailed = 3,
}

export type AppStatusStore = {
    loginStatus: LoginStatus,
}

export interface CustomAppStatusStore {
    subscribe: (state: AppStatusStore) => Unsubscriber,
    onLogin: (loginDetails: LoginDetails) => void;
    onLogout: () => void;
    getCurrentUser: () => NTKPerson;
}