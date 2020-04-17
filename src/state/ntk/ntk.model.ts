import { Unsubscriber } from '../state.model';

export type NTKPersonDetails = {
    id?: string,
    name: string,
    age: number,
    imageUrl: string,
    moreDetails: {
        hobbies: string[]
    }
}

export type NTKPerson = {
    ntkDetails: NTKPersonDetails,
    isMarked: boolean,
    hasAccepted: boolean,
}

export type NTKStore = {
    ntkPersons: NTKPerson[]
}


export interface CustomNTKStore {
    subscribe: (state: NTKStore) => Unsubscriber,
    onMarkedChanged: (id: string) => void;

}

/////////////////////
export function getMockNtk(): NTKPerson[] {
    const ntkPerons = [...Array.from(Array(16).keys()).map(key => {
        return {
            ntkDetails: {
                id: `id-${key}`,
                name: 'Nkt name',
                age: 25,
                imageUrl: "https://encrypted-tbn0.gstatic" +
                    ".com/images?q=tbn%3AANd9GcRu5trhUbXDbD2aQdTKFUERRxeYQH-98QIX59tug8132E-gz6Oo&usqp=CAU",
                moreDetails: {
                    hobbies: ['Skating, joggling']
                }
            },
            isMarked: false,
            hasAccepted: false
        }
    })];
    console.log(ntkPerons)
    return ntkPerons;
}
