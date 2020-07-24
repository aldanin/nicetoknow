<script>
  import Header from "./components/Header.svelte";
  import viewStore from "./state/view/viewStore";
  import appStateStore from "./state/app/appStatusStore";
  import customNtkStore from "./state/ntk/nktStore";
  import { onMount, onDestroy } from "svelte";
  import viewKeys from "./state/view/viewKeys";
  import { getView } from "../src/state/view/viewRepo";
  import { BLM } from "./BLM/BLM";
  import Loading from "./components/Loading.svelte";

  let currentView;
  let currentUser;
  let showHeader;

  let viewStoreUnsubscriber;
  let appStateUnsubscriber;

  onMount(async () => {
    await BLM.setAppData();

    appStateUnsubscriber = appStateStore.subscribe(state => {
      switch (state.loginStatus) {
        case 1: // Pedning
        viewStore.setView(viewKeys.LOGIN);
          showHeader = false;
          break;
        case 2: // LogedIn
        viewStore.setView(viewKeys.ALL_NTKS);
          customNtkStore.setStoreAsync();
          currentUser = BLM.getCurrentUser();
          showHeader = true;
          break;
        case 3: // LoginFailed
          alert("failed");
          break;
      }
    });

    viewStoreUnsubscriber = viewStore.subscribe(state => {
      console.log("state.currentView", state.currentView);
      currentView = state.currentView;
    });
  });

  onDestroy(() => {
    viewStoreUnsubscriber();
    appStateUnsubscriber();
  });

  function onUserClicked(event) {
    const user = event.detail;
    
  }
</script>

<style type="text/scss">
  .container-flex {
    flex-direction: column;
    background-color: whitesmoke;
    background-image: url("https://ak.picdn.net/shutterstock/videos/970717/thumb/1.jpg");
    background-repeat: no-repeat;
    background-size: cover;
    .message-holder {
    }
  }

  .NTK {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    font-size: 200px;
    text-shadow: 10px 10px 10px black;
    color: #da4343;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0.2;
    font-weight: bold;
    font-style: italic;
  }
</style>

<div class="desktop container-flex"> 
  <div class="NTK"><span>Nice To Know</span></div>
  <Header isHidden={!showHeader} {currentUser} on:userClicked={onUserClicked} />
  <svelte:component this={currentView ? currentView.view : Loading} />
  <div class="message-holder">
    <slot />
  </div>
</div>
