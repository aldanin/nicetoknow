<script>
    import MyNTKs from './components/MyNTKs.svelte';
    import MoreNKKs from './components/MoreNTKs.svelte';
    import Header from './components/Header.svelte';

</script>

<style type="text/scss">
    .container-flex {
        flex-direction: column;
    }
</style>

<div class="container-flex">
    <Header/>
    <MyNTKs/>
</div>
