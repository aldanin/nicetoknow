import * as agGrid from 'ag-grid-community'

function setGridOptions(componentContext, userGridOptions, userColDefs) {

    function onSelectionChanged(event) {
        userGridOptions.onSelectionChanged && userGridOptions.onSelectionChanged(event);
    }

    function onCellDoubleClicked(event) {
        userGridOptions.onCellDoubleClicked && userGridOptions.onCellDoubleClicked(event);
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
        onCellDoubleClicked,
        onGridReady,
        defaultColDef: {
            tooltipValueGetter: (params) => {
                return params.value
            }
        },
        enableBrowserTooltips: true,

    };

    return finalOptions;
}


const methods = {
    setGridOptions
}

export default methods;
