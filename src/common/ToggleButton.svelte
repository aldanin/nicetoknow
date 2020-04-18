<script>
    import {createEventDispatcher} from 'svelte';
    import IconButton, {Icon} from '@smui/icon-button';
    const dispatch = createEventDispatcher();

    export let isMarked = false;
    export let markedIcon
    export let unmarkedIcon
    export let title;

    function onClick() {
        dispatch('click')
    }

</script>


<style type="text/scss">
    :global(.toggle-button) {
        display: none;
    }
    :global(.toggle-button.active){
        display: block;
    }
</style>

<IconButton on:click={onClick}  aria-label="Add to favorites" title="{title}">
    <Icon
            class="material-icons toggle-button {isMarked ? 'active' : ''}">{markedIcon}</Icon>
    <Icon
            class="material-icons toggle-button {!isMarked ? 'active' :
                          ''}">{unmarkedIcon}</Icon>
</IconButton>
