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
  let showHeader;

  let viewStoreUnsubscriber;
  let appStateUnsubscriber;

  onMount(async () => {
    await BLM.setAppData();

    appStateUnsubscriber = appStateStore.subscribe(state => {
      switch (state.loginStatus) {
        case 1: // Pedning
          currentView = getView(viewKeys.LOGIN);
          showHeader = false;
          break;
        case 2: // LogedIn
        case 3: // LoginFailed
          currentView = getView(viewKeys.ALL_NTKS);
          customNtkStore.setStoreAsync();
          showHeader = true;
          break;
      }
    });

    viewStoreUnsubscriber = viewStore.subscribe(state => {});
  });

  onDestroy(() => {
    viewStoreUnsubscriber();
    appStateUnsubscriber();
  });
</script>

<style type="text/scss">
  .container-flex {
    flex-direction: column;
    background-color: whitesmoke;
  }
</style>

<div class="container-flex">
  <Header isHidden={!showHeader} />
  <svelte:component this={currentView ? currentView.view : Loading} />
</div>
