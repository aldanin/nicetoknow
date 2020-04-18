<script>
    import {onDestroy} from 'svelte';
    import NTKList from '../common/NTKList.svelte';
    import customNtkStore from '../state/ntk/nktStore.ts';
    import {Icon} from '@smui/icon-button';
    import NTKPersonPopup from '../common/NTKPersonPopup.svelte';

    let ntkList=[];
    let currentSelectedPerson;

    let isNTKPersonDialogOpen=false;

    const unsubscribe=customNtkStore.subscribe(state => {
        ntkList=state.ntkPersons.filter(ntkp => ntkp.isMarked)
    })

    function onMarkedChanged(event) {
        customNtkStore.onMarkedChanged(event.detail.id)
    }

    function onApprovalChanged(event) {
        customNtkStore.onApprovalChanged(event.detail.id, event.detail.isApproved)
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

    .no-ntks {
        display: flex;
        height: 100%;
        justify-content: center;
        align-items: center;
        flex-direction:column;
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
        <NTKList
                ntkList={ntkList}
                on:markedChanged={onMarkedChanged}
                isApproval="{true}"
                on:approvalChanged={onApprovalChanged}
        />
        {:else}
        <div class="no-ntks">
            <Icon class="material-icons">favorite_border</Icon>
            <h2>No nice-to-knows to approve</h2>
        </div>
    {/if}

</div>
<!--{#if isNTKPersonDialogOpen}-->
<!--    <NTKPersonPopup-->
<!--            ntkPerson="{currentSelectedPerson}"-->
<!--            on:dialogClosed={()=>isNTKPersonDialogOpen = false}-->
<!--    />-->
<!--{/if}-->


