<script>
  import { onDestroy, onMount } from "svelte";
  import NTKList from "../../common/NTKList.svelte";
  import customNtkStore from "../../state/ntk/nktStore";
  import viewStore from "../../state/view/viewStore";
  import NTKPersonPopup from "../../common/NTKPersonPopup.svelte";
  import { BLM } from "../../BLM/BLM";
  import CardView from "./CardView.svelte";
  import GridView from "./GridView.svelte";

  let ntkList;
  let currentSelectedPerson;

  let isNTKPersonDialogOpen = false;
  let isGridView = false;

  onMount(() => {
    ntkList = BLM.getOtherNtks();
  });

  const unsubscribe = customNtkStore.subscribe(state => {
    ntkList = BLM.getOtherNtks();
  });

  const unsubscribe2 = viewStore.subscribe(state => {
    isGridView = state.isGridView;
    console.log("isGridView 2", isGridView);
  });

  function onMarkedChanged(event) {
    customNtkStore.onMarkedChanged(event.detail.id);
  }

  onDestroy(() => {
    unsubscribe();
    unsubscribe2();
  });
  //
</script>

<style type="text/scss">
  .container {
    overflow: auto;
    .card-container {
      display: grid;
      grid-template-columns: repeat(3, minmax(8rem, 1fr));
      grid-auto-rows: 1fr;
      grid-gap: 30px;
      width: 1200px;
      height: 100%;
      margin: 30px auto;

      .item {
        margin: auto;
      }
    }
  }
</style>

<div class="container">
  {#if isGridView}
    <GridView {ntkList}/>
  {:else}
    <CardView {ntkList} on:markedChanged={onMarkedChanged} />
  {/if}

</div>
