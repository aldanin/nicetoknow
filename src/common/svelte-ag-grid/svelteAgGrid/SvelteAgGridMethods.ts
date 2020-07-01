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
    }

    const finalOptions={
        ...userGridOptions,
        columnDefs : userColDefs,
        onSelectionChanged,
        onGridReady,
    };

    return finalOptions;
}


const methods={
    setGridOptions
}

export default methods;
