<script lang="js">
  import { onMount, onDestroy } from "svelte";
  import SvelteAgGrid from "../../../common/svelte-ag-grid/svelteAgGrid/SvelteAgGrid.svelte";
  import {
    getColDefs,
    mapNtkPersonToGridRow,
    getGridOptions
  } from "./gridView.support";
  import NTKPersonDetailsPopup from '../../NtkDetailsPopup.svelte';

  export let ntkList;
  let gridData;
  let isNTKPersonDialogOpen = false;
  let currentSelectedPerson;

  $: {
    gridData = mapNtkPersonToGridRow(ntkList);
  }

  onMount(() => {});

  function onCellDoubleClicked(event) {
    const id = event.data.id;
    currentSelectedPerson = ntkList.find(ntkPerson => ntkPerson.ntkDetails.id === id);
    isNTKPersonDialogOpen = true;
    console.log('currentSelectedPerson', currentSelectedPerson)
  }

  function onGridReady(event) {
    //gridData = ntkList;
  }
</script>

<style type="text/scss">
  .container {
    height: 100%;
    width: 100%;
  }
</style>

<div class="container">
  <SvelteAgGrid
    gridOptions={getGridOptions({ onCellDoubleClicked })}
    colDefs={getColDefs()}
    {gridData}
    on:svelteGridReady={onGridReady} />
</div>

{#if isNTKPersonDialogOpen}
  <NTKPersonDetailsPopup
    ntkPerson={currentSelectedPerson}
    on:dialogClosed={() => (isNTKPersonDialogOpen = false)} />
{/if}
