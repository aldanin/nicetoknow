<script>
  import { onDestroy, onMount } from "svelte";
  import NTKList from "../common/NTKList.svelte";
  import customNtkStore from "../state/ntk/nktStore";
  import { Icon } from "@smui/icon-button";
  import NTKPersonPopup from "../common/NTKPersonPopup.svelte";
  import { BLM } from "../BLM/BLM";

  let ntkList = [];
  let currentSelectedPerson;

  let isNTKPersonDialogOpen = false;

  const unsubscribe = customNtkStore.subscribe(state => {
    console.log('all=>', state.ntkPersons)
    ntkList = BLM.getMyNtks();
  });

  function onMarkedChanged(event) {
    customNtkStore.onMarkedChanged(event.detail.id);
  }

  onMount(() => {
    ntkList = BLM.getMyNtks();
  });

  onDestroy(() => {
    unsubscribe();
  });
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

  .no-ntks {
    display: flex;
    height: 100%;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: silver;

    :global(.material-icons) {
      font-size: 300px;
    }

    h2 {
      font-style: italic;
      font-size: 30px;
      margin: 0;
    }
  }
</style>

<div class="container">
  {#if ntkList.length > 0}
    <NTKList {ntkList} on:markedChanged={onMarkedChanged} isApproval={false} />
  {:else}
    <div class="no-ntks">
      <Icon class="material-icons">favorite_border</Icon>
      <h2>You havn't selected any Nice-to-Knows</h2>
    </div>
  {/if}

</div>
