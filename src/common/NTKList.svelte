<script>
    import NTKCard from './NTKCard.svelte';
    import NTKPersonPopup from './NTKPersonPopup.svelte';

    export let ntkList=[];

    let currentSelectedPerson;

    let isNTKPersonDialogOpen = false;

    function onPersonSelected(event) {
        currentSelectedPerson = event.detail;
        isNTKPersonDialogOpen = true;
    }

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
    <div class="card-container">
        {#each ntkList as ntkPerson}
        <div class="item">
            <NTKCard
                    ntkPerson="{ntkPerson}"
                    on:markedChanged
                    on:ntkPersonSelected={onPersonSelected}
            />
        </div>

        {/each}
    </div>
</div>
{#if isNTKPersonDialogOpen}
    <NTKPersonPopup
            ntkPerson="{currentSelectedPerson}"
            on:dialogClosed={()=>isNTKPersonDialogOpen = false}
    />
{/if}

