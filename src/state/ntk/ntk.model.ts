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
    approvalList?: ConnectionDetails[],
}

// For Card UI purposes only:
export type PersonCard = {
    ntkDetails: Partial<NTKPersonDetails>, 
    isMarked: boolean,
    connectionStatus: ConnectionStatus,
}



export type NTKStore = {
    ntkPersons: NTKPerson[],
    hasFetched: boolean,
}

export type ConnectionDetails =  {
    id: string, // id of from/to person 
    connectionStatus: ConnectionStatus,
    isTo: boolean,
}

export type Gender = 'male' | 'female' | '';

export enum ConnectionStatus {
    pending = 1,
    rejected = 2,
    connected = 3
}


export interface CustomNTKStore {
    isEmpty: () => boolean,
    subscribe: (state: NTKStore) => Unsubscriber,
    setStoreAsync: () => void,
    onMarkedChanged: (id: string) => Promise<any>,
    onApprovalChanged: (id: string, isApproved: boolean) => void,
    myNtkPersons:  NTKPerson[],
    moreNtkPersons:  NTKPerson[],
    registerUser: (user: NTKPersonDetails)  => void,
    updateStore: (newState) => void,
}

