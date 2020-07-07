<script>
  import { onDestroy, onMount, createEventDispatcher } from "svelte";
  import NTKList from "../../common/NTKList.svelte";

  const dispatch = createEventDispatcher();
  export let ntkList;

</script>

<style type="text/scss">

</style>

<NTKList {ntkList} on:markedChanged isApproval={false} />
