<script>
  import Button, { Label } from "@smui/button";
  import UserDetailsPopup from "../components/UserDetailsPopup.svelte";
  import Avatar from "../common/Avatar.svelte";
  import { BLM } from "../BLM/BLM";

  let isRegistrationPopupOpen = false;
  let isLogoutShowing = false;
  let openUserUpdateDialog = false;
  export let currentUser;

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
</div>
{#if openUserUpdateDialog}
  <UserDetailsPopup
    currentUser={BLM.getCloneNtkPerson(currentUser)}
    on:popupClosed={onPopupClosed}
    on:submit={onUserDetailsSubmitted} />
{/if}
