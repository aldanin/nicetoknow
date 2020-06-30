<script>
  import NTKCard from "./NTKCard.svelte";
  import NTKPersonDetailsPopup from "../components/NtkDetailsPopup.svelte";
  import VirtualList from "@sveltejs/svelte-virtual-list";
  import { BLM } from "../BLM/BLM";
  export let ntkList = [];
  export let isApproval;
  let personCardList = [];
  import { ConnectionStatus } from "../state/ntk/ntk.model";

  let currentSelectedPerson;

  $: {
    personCardList = ntkList.map(ntkPerson => ({
      ntkDetails: ntkPerson.ntkDetails,
      isMarked: getIsMarked(ntkPerson),
      connectionStatus: getConnectionStatus(ntkPerson)
    }));
  }

  let isNTKPersonDialogOpen = false;

  function onPersonSelected(event) {
    currentSelectedPerson = event.detail;
    isNTKPersonDialogOpen = true;
  }

  function getConnectionStatus(ntkPerson) {
    const currentUser = BLM.getCurrentUser();
    let connectionStatus;

    const foundItem =
      currentUser.approvalList &&
      currentUser.approvalList.find(item => item.id === ntkPerson.ntkDetails.id);

    if (foundItem) {
      connectionStatus = foundItem.connectionStatus;
    } else {
      connectionStatus = ConnectionStatus.pending;
    }

    return connectionStatus;
  }

  function getIsMarked(ntkPerson) {
    const currentUser = BLM.getCurrentUser();

    const foundApprovalItem = currentUser.approvalList && currentUser.approvalList.find(item=>item.id === ntkPerson.ntkDetails.id);

    // const foundApprovalItem = ntkPerson.approvalList
    //   ? ntkPerson.approvalList.find(
    //       item => item.id === currentUser.ntkDetails.id
    //     )
    //   : ntkPerson.approvalList
    //   ? ntkPerson.approvalList.find(
    //       item =>
    //         item.id === currentUser.ntkDetails.id &&
    //         item.connectionStatus === ConnectionStatus.connected
    //     )
    //   : null;

    return !!foundApprovalItem;
  }
</script>

<style type="text/scss">
  .container {
    overflow: auto;
    .card-container {
      /*display: grid;*/
      /*grid-template-columns: repeat(3, minmax(8rem, 1fr));*/
      /*grid-auto-rows: 1fr;*/
      /*grid-gap: 30px;*/
      /*width: 1200px;*/
      height: 100%;
      /*margin: 30px auto;*/

      :global(svelte-virtual-list-row) {
        display: flex;
        justify-content: center;
      }

      .item {
        margin: 20px;
      }
    }
  }
</style>

<div class="container">
  <div class="card-container">
    <VirtualList items={personCardList} let:item>
      <!-- this will be rendered for each currently visible item -->
      <div class="item">
        <NTKCard
          personCard={item}
          on:markedChanged
          on:ntkPersonSelected={onPersonSelected}
          {isApproval}
          on:approvalChanged />
      </div>
    </VirtualList>
    {#each ntkList as ntkPerson}
      <!--        <div class="item">-->
      <!--            <NTKCard-->
      <!--                    ntkPerson="{ntkPerson}"-->
      <!--                    on:markedChanged-->
      <!--                    on:ntkPersonSelected={onPersonSelected}-->
      <!--                    isApproval="{isApproval}"-->
      <!--                    on:approvalChanged-->
      <!--            />-->
      <!--        </div>-->
    {/each}
  </div>
</div>
{#if isNTKPersonDialogOpen}
  <NTKPersonDetailsPopup
    ntkPerson={currentSelectedPerson}
    on:dialogClosed={() => (isNTKPersonDialogOpen = false)} />
{/if}
