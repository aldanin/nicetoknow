<script>
    import Header from './components/Header.svelte';
    import viewStore from './state/view/viewStore';
    import viewKeys from './state/view/viewKeys';

    let currentView;
    const unsubscribe = viewStore.subscribe(state => {
        currentView = state.currentView ? state.currentView : getView(viewKeys.MY_NTKS);
    })
</script>

<style type="text/scss">
    .container-flex {
        flex-direction: column;
        background-color: whitesmoke;
    }
</style>

<div class="container-flex">
    <Header/>
    <svelte:component this={currentView.view}/>
</div>
