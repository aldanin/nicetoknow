<script>
  import { setContext, onMount, createEventDispatcher } from "svelte";
  import MyIconButton from "../common/MyIconButton.svelte";
  import viewStore from "../state/view/viewStore";
  import viewKeys from "../state/view/viewKeys";
  import Button, { Label } from "@smui/button";
  import Search from "../common/Search.svelte";
  import UserControls from "./UserControls.svelte";
  import Switch from "@smui/switch";
  import FormField from "@smui/form-field";

  export let currentUser;
  export let isHidden = false;
  export let isGridView = false;

  const dispatch = createEventDispatcher();

  setContext("setViewToRegister", {
    setViewToRegister: () => viewStore.setView(viewKeys.REGISTER)
  });

  function onMyNtksClicked() {
    viewStore.setView(viewKeys.MY_NTKS);
  }

  function onShowMoreClicked() {
    viewStore.setView(viewKeys.ALL_NTKS);
  }

  function onNtksApprovalClicked() {
    viewStore.setView(viewKeys.NTKS_APPROVAL);
  }

  function onViewChanged(event) {
    const state = event.currentTarget.checked;
    viewStore.isGridViewChanged(state);
  }
</script>

<style type="text/scss">
  .container {
    max-width: 100%;
    width: unset;
    height: 60px;
    box-shadow: 0 4px 2px -2px grey;
    background-color: #a70000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 30px;
    position: relative;

    .logo {
      font-family: fantasy;
      font-style: italic;
      fonty-weight: bold;
      color: #e8e8ff;
      font-weight: 500;
      font-size: 25px;
    }

    .mid-controls {
      height: 100%;
      display: flex;
      align-items: center;

      .switch {
        color: #efefef;
        width: 150px;
        font-weight: bold;
      }
    }

    .controls {
      display: flex;
      height: 100%;
      color: white;
      align-items: center;
      .userWrap {
        display: flex;
        align-items: center;
        height: 80%;

        :global(.myClass) {
          color: white;
          font-size: 80%;
        }

        :global(.mdc-button__label) {
          color: gainsboro;
          font-size: 70%;
          text-decoration: underline;
        }

        .hi-span {
          margin-right: 1em;
        }
      }
    }

    :global(.focused-button) {
      color: yellow;
    }
  }

  .switch-label {
   margin-left: 10px;
    white-space: nowrap;
    color: #98f1d8;
    text-transform: uppercase;
    font-family: sans-serif;
    font-size: 75%;
    font-weight: bold;
  }

  .is-hidden {
    visibility: hidden;
  }
</style>

<header class="container {isHidden ? 'is-hidden' : ''}">
  <div class="logo">
    <span class="logo-inner">Nice to know</span>
  </div>
  <div class="mid-controls">
    <Search />
    <FormField class="switch">
      <Switch
        color="primary"
        bind:checked={isGridView}
        on:change={onViewChanged} />
     
    </FormField>
     <span class="switch-label">
        {#if isGridView}
        Card View
        {:else
        }Grid View
        {/if}
      </span>
  </div>
  <div class="controls">
    <MyIconButton
      icon="favorite_border"
      title="My Nice-to-know's"
      on:click={onMyNtksClicked} />
    <MyIconButton
      icon="favorite"
      title="Nice-to-know's to approve"
      on:click={onNtksApprovalClicked} />
    <MyIconButton icon="face" title="Show more" on:click={onShowMoreClicked} />
    <UserControls {currentUser} />
  </div>
</header>
