<script>
  import { setContext, onMount, createEventDispatcher } from "svelte";
  import MyIconButton from "../common/MyIconButton.svelte";
  import viewStore from "../state/view/viewStore";
  import viewKeys from "../state/view/viewKeys";
  import NtkStore from "../state/ntk/nktStore";
  import UserDetailsPopup from "../components/UserDetailsPopup.svelte";
  import Avatar from "../common/Avatar.svelte";
  import Button, { Label } from "@smui/button";
  import { BLM } from "../BLM/BLM";
  import Card from "@smui/card";

  const dispatch = createEventDispatcher();
  let isRegistrationPopupOpen = false;
  export let currentUser;
  export let isHidden = false;
  let isLogoutShowing = false;
  let openUserUpdateDialog = false;

  $: console.log("hjeader currentUser", currentUser);

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

  function logout() {
    BLM.logout();
  }

  function registrationSubmitted(e) {
    isRegistrationPopupOpen = false;
    NtkStore.registerUser(e.detail.value);
  }

  function onAvatarDblclick() {
    openUserUpdateDialog = true;
  }

  function onPopupClosed() {
    openUserUpdateDialog = false;
  }

  function onUserDetailsSubmitted(e) {
    const details = e.detail;
    console.log('details',details)
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

  .is-hidden {
    visibility: hidden;
  }

  :global(.logout-card) {
    position: absolute;
    top: 40px;
    right: 100px;
    z-index: 2;
    cursor: pointer;
  }
</style>

<header class="container {isHidden ? 'is-hidden' : ''}">
  <div class="logo">
    <span class="logo-inner">Nice to know</span>
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
    <div class="userWrap">
      <Button on:click={() => (isLogoutShowing = true)} class="myClass">
        <span class="hi-span">Hi</span>
        <span class="userName-span">
          {currentUser ? currentUser.ntkDetails.name : ''}
        </span>

      </Button>
      <Avatar
        imageUrl={currentUser ? currentUser.ntkDetails.imageUrl : null}
        on:dblclick={onAvatarDblclick} />
    </div>

  </div>
  {#if isLogoutShowing}
    <Card class="logout-card" padded on:click={() => (isLogoutShowing = false)}>
      <Label on:click={logout}>Log out</Label>
    </Card>
  {/if}
</header>

{#if openUserUpdateDialog}
  <UserDetailsPopup
    currentUser = {BLM.getCloneNtkPerson(currentUser)}
    on:popupClosed={onPopupClosed}
    on:submit={onUserDetailsSubmitted} />
{/if}
