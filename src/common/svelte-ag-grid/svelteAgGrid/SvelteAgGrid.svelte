<script lang="js">
  import { onMount, createEventDispatcher } from "svelte";

  import "ag-grid-community/dist/styles/ag-grid.css";
  import "ag-grid-community/dist/styles/ag-theme-material.css";
  import "ag-grid-community/dist/styles/ag-theme-alpine-dark.css";
  import "ag-grid-community/dist/styles/ag-theme-alpine.css";

  import * as agGrid from "ag-grid-community";
  import methods from "./SvelteAgGridMethods";

  export let gridOptions;
  export let colDefs;
  export let theme = "ag-theme-alpine";

  export let gridData;
  let pervGridData;

  const dispatch = createEventDispatcher();

  let gridDiv;
  let thisGrid;
  let thisGridReady = false;
  let componentContext = {
    dispatch,
    onSvelteGridReady
  };

  let finalGridOptions = methods.setGridOptions(
    componentContext,
    gridOptions,
    colDefs
  );

  onMount(() => {
    thisGrid = new agGrid.Grid(gridDiv, finalGridOptions);
  });

  $: {
    console.log(
      "componentContext.api1 thisGridReady, pervGridData, gridData",
      thisGridReady,
      pervGridData,
      gridData,
      !!componentContext.api
    );
    if (pervGridData !== gridData && componentContext.api) {
      console.log("componentContext2", pervGridData === gridData, gridData);
      componentContext.api.setRowData(gridData);
      pervGridData = gridData;
    }
  }

  function onSvelteGridReady(event) {
    thisGridReady = true;
  }

  function onSelectionChanged() {
    var selectedRows = finalGridOptions.api.getSelectedRows();
    document.querySelector("#selectedRows").innerHTML =
      selectedRows.length === 1 ? selectedRows[0].athlete : "";
  }
</script>

<style type="text/scss">
  .container {
    height: 100%;
    width: 100%;

    .grid-div {
      height: 100%;
      width: 100%;
    }
  }
</style>

<div class="container">
  <div bind:this={gridDiv} class="grid-div {theme}" />
</div>
