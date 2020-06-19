import { Unsubscriber } from "../state.model"

export type LoginDetails = {
    status: LoginStatus,
    userName?: string
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
}