<script lang="js">
  import { onMount, onDestroy } from "svelte";
  import SvelteAgGrid from "../../common/svelte-ag-grid/svelteAgGrid/SvelteAgGrid.svelte";

  export let ntkList;
  let gridData;

  $: {
    gridData = ntkList.map(ntkPerson => {
      const details = ntkPerson.ntkDetails;
      const location = details.moreDetails.location || {};
      return {
        id: details.id,
        name: details.name,
        age: details.age,
        gender: details.gender,
        email: details.email,
        cell: details.cell,
        imgaeUrl: details.imgaeUrl,
        about: details.moreDetails.about,
        hobbies: details.moreDetails.hobbies,
        address: `${location.street.number} ${location.street.name}, ${location.state}, ${location.country}` 
      };
    });
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

  const colDefs = [
    { field: "name", maxWidth: 150 },
    { field: "age", minWidth: 150 },
    { field: "gender", maxWidth: 90 },
    { field: "cell", minWidth: 150 },
    { field: "email", minWidth: 150 },
    { field: "about", minWidth: 150 },
    { field: "hobbies", minWidth: 150 },
    { field: "address", minWidth: 150 }
  ];

  const gridOptions = {
    defaultColDef: {
      flex: 1,
      minWidth: 100
    },
    rowSelection: "single",
    onSelectionChanged: onSelectionChanged,
    onGridReady: event => {
      console.log("gridView, ", event.api);
    }
  };

  onMount(() => {});

  function onSelectionChanged(event) {
    console.log("onSelectionChanged", event);
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
    {gridOptions}
    {colDefs}
    {gridData}
    on:svelteGridReady={onGridReady} />
</div>
