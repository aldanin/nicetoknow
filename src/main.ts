import App from "./App.svelte";    
import './_styles/global.scss';
import "regenerator-runtime/runtime.js";

const app = new App({
  target: document.body,
  props: {
    name: "world"
  }
});

export default app;
