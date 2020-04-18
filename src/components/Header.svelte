<script>
    import IconButton, {Icon} from '@smui/icon-button';
    import MyIconButton from '../common/MyIconButton.svelte';
    import viewStore from '../state/view/viewStore';
    import viewKeys from '../state/view/viewKeys';
    import NtkStore from '../state/ntk/nktStore.ts';
    import RegistrationPopup from '../components/RegistrationPopup.svelte';

    let isRegistrationPopupOpen = false;

    function onMyNtksClicked() {
        viewStore.setView(viewKeys.MY_NTKS);
    }

    function onShowMoreClicked() {
        viewStore.setView(viewKeys.GENERAL_NTKS);
    }

    function onNtksApprovalClicked() {
        viewStore.setView(viewKeys.NTKS_APPROVAL);
    }

    function showRegistrationForm() {
        isRegistrationPopupOpen = true;
    }

    function registrationPopupClosed(e){
        isRegistrationPopupOpen = false
        NtkStore.registerUser(e.detail.value);
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

        .logo {
            font-family: fantasy;
            font-style: italic;
            fonty-weight: bold;
            color: #e8e8ff;
            font-weight: 500;
            font-size: 25px;
        }

        .controls {
            color: white;
        }

        :global(.focused-button) {
            color:yellow;
        }
    }
</style>

<header class="container">
    <div class="logo">
        <span class="logo-inner">Nice to know</span>
    </div>
    <div class="controls">
        <MyIconButton icon="favorite_border" title="My Nice-to-know's" on:click={onMyNtksClicked}/>
        <MyIconButton icon="favorite" title="Nice-to-know's to approve" on:click={onNtksApprovalClicked}/>
        <MyIconButton icon="face" title="Show more" on:click={onShowMoreClicked}/>
        <MyIconButton icon="how_to_reg" title="Show more" on:click={showRegistrationForm}/>
    </div>
</header>

{#if isRegistrationPopupOpen}
    <RegistrationPopup
            on:popupClosed={registrationPopupClosed}
    />
{/if}
