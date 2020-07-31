<script>
  import { createEventDispatcher } from "svelte";
  import Textfield, { Input, Textarea } from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text/index";
  import Icon from "@smui/textfield/icon/index";

  export let isError = false;
  export let errorMessage = "";
  export let label = "";
  export let minWidth;
  export let type;

  export let value = "";
  export let dirty = false;
  export let invalid = false;
  export let isTextArea = false;
  let invalidClickable = false;
  let valueClickable = "";
  let dirtyClickable = false;

  const dispatch = createEventDispatcher();

  $: {
    if (isError) {
      clickableHandler();
    }
  }

  function clickableHandler() {
    valueClickable = "";
    dirtyClickable = false;
  }

  function onKeydown(event) {
    dispatch("keyup", value);
  }
</script>

<style>

</style>

{#if !isTextArea}
  <Textfield
    {type}
    class={$$props.class}
    fullwidth
    withTrailingIcon={value !== ''}
    bind:dirty
    bind:invalid
    on:keyup={onKeydown}
    updateInvalid 
    bind:value
    {label}
    style="min-width: {minWidth ? `${minWidth}px` : '250px'}" />
  <HelperText validationMsg>{errorMessage}</HelperText>
{:else}
  <Textfield
    class={$$props.class}
    textarea
    fullwidth
    lineRipple={false}
    bind:value
    {label}
    input$aria-controls="helper-text-fullwidth"
    input$aria-describedby="helper-text-fullwidth" />
  <HelperText validationMsg>{errorMessage}</HelperText>
{/if}

<!--           input$autocomplete="email"-->
