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
    isApproved?: boolean,
}

export type NTKStore = {
    ntkPersons: NTKPerson[],
    hasFetched: boolean,
}

export type Gender = 'male' | 'female' | '';


export interface CustomNTKStore {
    subscribe: (state: NTKStore) => Unsubscriber,
    setStoreAsync: () => void,
    onMarkedChanged: (id: string) => void,
    onApprovalChanged: (id: string, isApproved: boolean) => void,
    myNtkPersons:  NTKPerson[],
    moreNtkPersons:  NTKPerson[],
    registerUser: (user: NTKPersonDetails)  => void
}

