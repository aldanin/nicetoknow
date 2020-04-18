import { Gender, NTKPerson } from "./ntk.model";

export async function getMockNtk(): Promise<NTKPerson[]> {
    const ntkPerons = [...Array.from(Array(50).keys()).map(key => {
        return {
            ntkDetails: {
                id: `id-${key}`,
                name: 'Nkt name',
                age: 25,
                imageUrl: "https://encrypted-tbn0.gstatic" +
                    ".com/images?q=tbn%3AANd9GcRu5trhUbXDbD2aQdTKFUERRxeYQH-98QIX59tug8132E-gz6Oo&usqp=CAU",
                moreDetails: {
                    hobbies: ['Skating, joggling'],
                    "email": "kayla.scott@example.com",
                }
            },
            isMarked: false,
            isApproved: false
        }
    })];

    fetch('https://randomuser.me/api/?results=200').then(res=> {

        res.json().then(data=> {
            console.log('fetched', data)
        })
    })
    console.log(ntkPerons)
    return ntkPerons;
}

export async function getMockUsers(count = 20, gender: Gender = '') :  Promise<NTKPerson[]> {
    const res =
        await fetch(`https://randomuser.me/api/?results=${count}&gender={${gender}&seed=alondanin`);
    const data = await res.json();
    const ntkData: NTKPerson[] = data.results.map((user: any) => {
        const ntkPerson: NTKPerson = {
            ntkDetails: {
                id: `${user.login.uid}`,
                name: `${user.name.first} ${user.name.last}`,
                age: user.dob.age,
                imageUrl: `${user.picture.large}`,
                moreDetails: {
                    hobbies: [],
                    email: `${user.email}`
                }
            },
            isMarked: false,
            isApproved: false,
        }

        return ntkPerson;
    })

    return ntkData;
}
