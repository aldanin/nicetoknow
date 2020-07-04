export type GridRow = {
    id: string,
    avatar: string,
    name: string,
    age: number,
    gender: string,
    email: string,
    cell: string,
    about: string,
    hobbies: string,
    address: string
}

export type GridOptionsProps = {
    onCellDoubleClicked: (event) => void
}