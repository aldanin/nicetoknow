import { Unsubscriber } from '../state.model';

export type NTKPersonDetails = {
    id?: string,
    name: string,
    age: number,
    imageUrl: string,
    moreDetails: {
        about: string;
        hobbies: string,
        email: string
    }
}

export type NTKPerson = {
    ntkDetails: Partial<NTKPersonDetails>,
    isMarked: boolean,
    approvalStatus?: ApprovalStatus,
}

export type NTKStore = {
    ntkPersons: NTKPerson[],
    hasFetched: boolean,
}

export type Gender = 'male' | 'female' | '';

export enum ApprovalStatus {
    pending = 1,
    disapproved = 2,
    approved = 3
}


export interface CustomNTKStore {
    isEmpty: () => boolean,
    subscribe: (state: NTKStore) => Unsubscriber,
    setStoreAsync: () => void,
    onMarkedChanged: (id: string) => Promise<any>,
    onApprovalChanged: (id: string, approvalStatus: ApprovalStatus) => void,
    myNtkPersons:  NTKPerson[],
    moreNtkPersons:  NTKPerson[],
    registerUser: (user: NTKPersonDetails)  => void
}

