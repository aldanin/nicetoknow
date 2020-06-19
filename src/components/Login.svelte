<script>
  import { createEventDispatcher, onMount } from "svelte";
  import TextBox from "../common/TextBox.svelte";
  import Paper from "@smui/paper";
  import { Actions } from "@smui/dialog";
  import Button, { Label } from "@smui/button";
  import Avatar from "../common/Avatar.svelte";
  import FileUpload from "sveltefileuploadcomponent";
  import ViewStore from "../state/view/viewStore";
  import { BLM } from "../BLM/BLM";

  let userName;

  const dispatch = createEventDispatcher();

  onMount(() => {});

  function submit(e) {
    BLM.login(userName);
  }

  function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
  
</script>

<style type="text/scss">
  .header {
    height: 50px;
    font-size: 20px;
    text-transform: uppercase;
    font-weight: 500;
    color: #b72f61;
    padding-left: 10px;
    line-height: 45px;
  }

  .paper-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    min-height: 0;

    .paper {
      width: 400px;
    }
  }

  .form-details {
    margin: 30px 0;
  }

  :global(.mdc-typography--body2),
  :global(.mdc-typography--caption) {
    font-family: Roboto, sans-serif;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    line-height: 1.25rem;
    font-weight: 400;
    text-decoration: inherit;
    text-transform: inherit;
  }

  :global(.actions) {
    margin-top: 10px;
  }

  :global(.about-me) {
    margin-top: 20px;
  }

  .card-details {
    width: 400px;
    padding: 0 15px;
    overflow: auto;
  }

  .avatar-container {
    display: flex;
    height: 120px;
    width: 100%;
    justify-content: space-evenly;
    align-items: center;
    border-bottom: solid 1px #ececec;
    cursor: pointer;

    .person-details {
      width: 200px;

      h3,
      h5 {
        margin: 0;
      }

      .ntk-name {
        margin-bottom: 10px;
      }

      .ntk-age {
        color: #b3b3b3;
      }
    }
  }

  .ntk-details-rows-container {
    margin-top: 5px;

    .ntk-details-row {
      .caption {
        color: #b3b3b3;
        text-transform: uppercase;
        font-size: 13px;
      }

      .details {
        color: #666666;
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
</style>

<div class="paper-wrap">
  <Paper class="paper">
    <header class="header">Login</header>
    <div class="card-details">
      <div class="form-details">
        <TextBox
          bind:value={userName}
          label="Please Enter your user name"
          minWidth={350} />
      </div>
    </div>
    <Actions class="actions">
      <Button variant="raised" on:click={submit}>
        <Label>Submit</Label>
      </Button>
    </Actions>
  </Paper>
</div>
