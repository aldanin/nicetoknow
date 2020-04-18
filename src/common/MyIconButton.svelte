<script>
    import {createEventDispatcher} from 'svelte';
    import IconButton, {Icon} from '@smui/icon-button';
    const dispatch = createEventDispatcher();

    export let title='';
    export let icon;

    let isFocued;
    function onClick(e) {
        dispatch('click', e);

    }

</script>

<style type="text/scss">

</style>

<IconButton class="material-icons"
            on:click={onClick}
            title={title}>{icon}
</IconButton>
