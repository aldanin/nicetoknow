import { Gender, NTKPerson } from "./ntk.model";

export async function getMockUsers(count = 20, gender: Gender = '') :  Promise<NTKPerson[]> {
    const res =
        await fetch(`https://randomuser.me/api/?results=${count}&gender=${gender}&seed=alondanin`);
    const data = await res.json();
    const ntkData: NTKPerson[] = data.results.map((user: any) => {
        const ntkPerson: NTKPerson = {
            ntkDetails: {
                id: user.login.uid,
                name: `${user.name.first} ${user.name.last}`,
                age: user.dob.age,
                gender: user.gender,
                imageUrl: user.picture.large,
                email: user.email,
                cell: user.cell,
                moreDetails: {
                    about: `Svelte is a radical new approach to building user interfaces. Whereas traditional frameworks like React and Vue do the bulk of their work in the browser, Svelte shifts that work into a compile step that happens when you build your app.

Instead of using techniques like virtual DOM diffing, Svelte writes code that surgically updates the DOM when the state of your app changes.`,
                    hobbies: `bike, dance, comedies`, 
                    location: user.location
                }
            },
        }

        return ntkPerson;
    })

    return ntkData;
}
