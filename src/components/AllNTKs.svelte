<script>
    import {onDestroy, onMount} from 'svelte';
    import NTKList from '../common/NTKList.svelte';
    import customNtkStore from '../state/ntk/nktStore';
    import NTKPersonPopup from '../common/NTKPersonPopup.svelte';

    let ntkList=[];
    let currentSelectedPerson;

    let isNTKPersonDialogOpen = false;

    onMount(() => {
        if (customNtkStore.isEmpty()) {
            customNtkStore.setStoreAsync();
        }
    })

    const unsubscribe=customNtkStore.subscribe(state => {
        ntkList=state.ntkPersons
    })

    function onMarkedChanged(event) {
        customNtkStore.onMarkedChanged(event.detail.id) 
    }

    onDestroy(() => {
        unsubscribe();
    })
    //
    // function onPersonSelected(event) {
    //     currentSelectedPerson = event.detail;
    //     isNTKPersonDialogOpen = true;
    // }

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
   <NTKList
           ntkList={ntkList}
           on:markedChanged={onMarkedChanged}
           isApproval="{false}"
   />
</div>
<!--{#if isNTKPersonDialogOpen}-->
<!--    <NTKPersonPopup-->
<!--            ntkPerson="{currentSelectedPerson}"-->
<!--            on:dialogClosed={()=>isNTKPersonDialogOpen = false}-->
<!--    />-->
<!--{/if}-->


