<script>
  import { onMount, onDestroy } from "svelte";
  import { fly, fade } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import systemMessageService from "./systemMessage.store";

  export let messageObj = {
    text: "Message",
    isError: true,
    isOpen: false
  };
  let msgServiceUnsubscribe;

  onMount(() => {
    msgServiceUnsubscribe = systemMessageService.subscribe(message => {
      messageObj = { isOpen: false, ...message };
    });
  });

  onDestroy(() => {
    if (msgServiceUnsubscribe) {
      msgServiceUnsubscribe();
    }
    // msgServiceUnsubscribe?.();
  });

  function closeMessage(isAuto = false) {
    if (isAuto && messageObj.isOpen) {
      setTimeout(
        () => {
           systemMessageService.closeMessage();
        },
        2000
      );
    } else {
      systemMessageService.closeMessage();
    }
  }
</script>

<style type="text/scss">
  .wrap {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 80px;
    min-width: 200px;
    border: solid 1px #757575;
    border-radius: 8px;

    .message-wrap {
      color: white;
      h5,
      p {
        margin: 10px;
      }

      p {
        font-weight: bold;
      }

      h5 {
        color: rgb(224, 224, 224);
      }
    }
    &.msgSuccess {
      background-color: yellowgreen;
    }

    &.msgError {
      background-color: red;
    }
  }
</style>

{#if messageObj.isOpen}
  <div
    class="wrap"
    class:msgSuccess={!messageObj.isError}
    class:msgError={messageObj.isError}
    in:fly={{ x: -100, duration: 1000, easing: quintOut }}
    out:fly={{ x: -100, duration: 800, easing: quintOut }}
    on:introend={() => !messageObj.isError && closeMessage(true)}
    on:click={() => closeMessage()}>

    <div class="message-wrap">
      {#if messageObj.isError}
        <h5>Error</h5>
      {/if}

      <p>{messageObj.text}</p>
    </div>
  </div>
{/if}
