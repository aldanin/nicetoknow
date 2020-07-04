import * as agGrid from 'ag-grid-community'

function setGridOptions(componentContext, userGridOptions, userColDefs) {

    function onSelectionChanged(event) {
        userGridOptions.onSelectionChanged(event);
    }

    function onGridReady(event) {
        componentContext.api = event.api;
        componentContext.dispatch('svelteGridReady', {
            api: event.api,
        })
        userGridOptions.onGridReady && userGridOptions.onGridReady(event);
        componentContext.onSvelteGridReady(event);
    }

    const finalOptions: agGrid.GridOptions = {
       
        ...userGridOptions,
        columnDefs: userColDefs,
        onSelectionChanged,
        onGridReady,
         defaultColDef: {
            tooltipValueGetter: (params) => {
return 'alon'
            }
        }, 
    };

    return finalOptions;
}


const methods = {
    setGridOptions
}

export default methods;
