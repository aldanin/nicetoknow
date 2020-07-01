<script>
  import Button, { Label } from "@smui/button";
  import UserDetailsPopup from "../components/UserDetailsPopup.svelte";
  import Avatar from "../common/Avatar.svelte";
  import { BLM } from "../BLM/BLM";
  import Card from "@smui/card";

  let isRegistrationPopupOpen = false;
  let isLogoutShowing = false;
  let openUserUpdateDialog = false;
  export let currentUser;

  $: console.log("hjeader currentUser", currentUser);

  function logout() {
    BLM.logout();
  }

  function onAvatarDblclick() {
    openUserUpdateDialog = true;
  }

  function onPopupClosed() {
    openUserUpdateDialog = false;
  }

  function onUserDetailsSubmitted(e) {
    const details = e.detail;
    console.log("details", details);
  }
</script>

<style type="text/scss">
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

  :global(.logout-card) {
    position: absolute;
    top: 40px;
    right: 100px;
    z-index: 2;
    cursor: pointer;
    color: #0089ff;
  }
</style>

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
  {#if isLogoutShowing}
    <Card class="logout-card" padded on:click={() => (isLogoutShowing = false)}>
      <Label on:click={logout}>Log out</Label>
    </Card>
  {/if}
</div>
{#if openUserUpdateDialog}
  <UserDetailsPopup
    currentUser={BLM.getCloneNtkPerson(currentUser)}
    on:popupClosed={onPopupClosed}
    on:submit={onUserDetailsSubmitted} />
{/if}
