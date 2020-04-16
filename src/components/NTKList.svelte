<script>
    import Paper, {Title, Subtitle} from '@smui/paper';
    import NTKCard from './NTKCard.svelte';
    import customNtkStore from '../state/nktStore.ts';

    let ntkArray=[];

    const unsubscribe=customNtkStore.subscribe(state => {
        ntkArray=state.ntkPersons
    })

    function onMarkedChanged(event) {


        customNtkStore.onMarkedChanged(event.detail.id)
    }


</script>

<style type="text/scss">
    .card-container {
        display: grid;
        grid-template-columns: repeat(4, minmax(8rem, 1fr));
        grid-auto-rows: 1fr;
        column-gap: 15px;
        row-gap: 15px;
        width: 100%;
        height: 100%;
    }
</style>

<div class="card-container">
    {#each ntkArray as ntkPerson}
        <NTKCard ntkPerson="{ntkPerson}" on:markedChanged="{onMarkedChanged}"/>
    {/each}
</div>
