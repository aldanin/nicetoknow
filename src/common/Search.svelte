<script>
  import TextBox from "../common/TextBox.svelte";
  import { BLM } from "../BLM/BLM";

  export let searchWord;

  function onSearchKeyup(event) {
    BLM.onSearchChanged(event.detail);
  }
</script>

<style type="text/scss">
  .container {
    height: 100%;
    display: flex;
    align-items: center;
    
    :global(.mdc-text-field__input) {
      border-bottom-color: white;
      background-color: white;
      padding-left: 5px;
    }

    :global(.mdc-text-field) {
        height: 60%;
    }
  }
</style>

<div class="container">
  <TextBox
    type="text"
    bind:value={searchWord}
    label="Enter search text"
    minWidth={200}
    on:keyup={onSearchKeyup} />

</div>
