import { NTKPerson } from "../../../state/ntk/ntk.model";
import { GridRow, GridOptionsProps } from "./gridView.model";
import { ColDef, GridOptions } from "ag-grid-community";

export function mapNtkPersonToGridRow(ntkList: NTKPerson[]): GridRow[] {
    const gridData: GridRow[] = ntkList.map(ntkPerson => {
        const details = ntkPerson.ntkDetails;
        const location = details.moreDetails.location;
        return {
            id: details.id,
            avatar: details.imageUrl,
            name: details.name,
            age: details.age,
            gender: details.gender,
            email: details.email,
            cell: details.cell,
            about: details.moreDetails.about,
            hobbies: details.moreDetails.hobbies,
            address: location
            ? `${location.street.number} ${location.street.name}, ${location.state}, ${location.country}`
            : '',
            // isMarked: ntkPerson.
        };
    });

    return gridData
}
//    moreDetails: {
//         about: string;
//         hobbies: string,
//         location?: {
//             street?: {
//                 number: number,
//                 name: string
//             },
//             city?: string,
//             state?: string,
//             country?: string,
//             postcode?: number,
//             coordinates?: {
//                 latitude: string, // "15.8027"
//                 longitude: string, // "-159.5965"
//             },
//         }
//     }

export function getColDefs(): ColDef[] {
    const colDefs: ColDef[] = [
        {
            headerName: '',
            field: "avatar",
            cellRenderer: avatarRenderer,
            width: 50
        },
        {
            headerName: '',
            field: 'isMarked',
            cellRenderer:isMarkedRenderer,
            width: 70
        },
        { field: "name", maxWidth: 150 },
        { field: "age", minWidth: 150 },
        {
            field: "gender",
            maxWidth: 90,
            cellRenderer: genderRenderer
        },
        { field: "cell", minWidth: 150 },
        { field: "email", minWidth: 150 },
        { field: "about", minWidth: 150 },
        { field: "hobbies", minWidth: 150 },
        { field: "address", minWidth: 150 }
    ];

    return colDefs;
}

export function getGridOptions(props: GridOptionsProps) : GridOptions {
    const gridOptions = {
        getRowNodeId: data => {
          return data.id;
        },
        defaultColDef: {
        //   flex: 1,
        //   minWidth: 100,
        //   sortable: true,
        editable: true,
        sortable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
        resizable: true
        },
        rowSelection: "single",
        sortable: true,
        onCellDoubleClicked: props.onCellDoubleClicked,
        onGridReady: event => {
          console.log("gridView, ", event.api);
        },

      };

      return gridOptions; 
}

function avatarRenderer(params) {
    return `<div style='display:flex;align-items:center;height: 100%;'>
                 <img src=${params.value} style='height:85%;border-radius: 50%;'/>
            </div>`;
}

function genderRenderer(params) {
    const emoji = params.value === 'male' ? '&#128104' : (params.value === 'female' ? '&#128105' : '');
    return `<span style='font-size: 1.5em;'>${emoji}</span`;
}

function isMarkedRenderer(params) {
    return params.value === true ?`Marked`: 'Unmarked'
}



