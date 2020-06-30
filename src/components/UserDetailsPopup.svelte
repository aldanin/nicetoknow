<script>
  import { createEventDispatcher, onMount } from "svelte";
  import TextBox from "../common/TextBox.svelte";
  import Dialog, { Title, Content, Actions, InitialFocus } from "@smui/dialog";
  import Button, { Label } from "@smui/button";
  import Avatar from "../common/Avatar.svelte";
  import FileUpload from "sveltefileuploadcomponent";
  import { BLM } from "../BLM/BLM";

  export let currentUser;
  let simpleDialog;
  // let name;
  // let email;
  // let hobbies;
  // let age;
  // let aboutMe;
  // let imageUrl;

  const dispatch = createEventDispatcher();

  onMount(() => {
    simpleDialog.open();
    // const details = currentUser.ntkDetails;
    // name = details.name;
    // email = details.email;
    // hobbies = details.hobbies;
    // age = details.age;
    // aboutMe = details.moreDetails.aboutMe;
    // imageUrl = details.moreDetails.imageUrl;
  });

  async function gotFiles(event) {
    const data = await getBase64(event.detail.files[0]);
    console.log("vase84", data);
    currentUser.ntkDetails.imageUrl = data;
  }

  function closeHandler(e) {
    dispatch("popupClosed", {});
  }

  function submit(e) {
    BLM.updateUserDetails(currentUser.ntkDetails);
  }

  function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  function onClosing(e) {
    console.log("onClosing", e);
    e.stopPropagation();
  }

  // function cancel() {
  //   ViewStore.setView(viewKeys.LOGIN);
  // }
</script>

<style type="text/scss">
  .header {
    height: 50px;
    background-color: #efefef;
    font-size: 20px;
    text-transform: uppercase;
    font-weight: 500;
    color: gray;
    padding-left: 10px;
    line-height: 45px;
  }

  .form-details {
    display: flex;
    justify-content: space-between;

    .form-details-column {
      width: 400px;
    }
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

  .actions {
    margin-top: 10px;
  }

  :global(.about-me) {
    margin-top: 20px;
  }

  .card-details {
    width: 850px;
    padding: 0 15px;
    overflow: auto;

    .file-uploader-class {
      height: 100px;
    }

    .name-tb {
      margin-left: 20px;
    }
  }

  .avatar-container {
    display: flex;
    height: 120px;
    width: 100%;
    //justify-content: space-evenly;
    align-items: center;
    border-bottom: solid 1px #ececec;
    cursor: pointer;

    .name-div {
        margin-left: 20px;
        font-size: 200%;
        font-weight: bold;
        color: #989898;
      }

    .person-details {
      width: 200px;
      margin-left: 20px;
      h3,
      h5 {
        margin: 0;
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

<Dialog
  bind:this={simpleDialog}
  aria-labelledby="simple-title"
  aria-describedby="simple-content"
  on:MDCDialog:closed={closeHandler}
  on:MDCDialog:closing={onClosing}>
  <header class="header">Update User Details</header>
  <div class="card-details">
    <div class="avatar-container">
      <FileUpload on:input={gotFiles}>
        <Avatar imageUrl={currentUser.ntkDetails.imageUrl} height="100px" />
      </FileUpload>

      <div class="name-div">{currentUser.ntkDetails.name}</div>
    </div>
    <div class="form-details">
      <div class="form-details-column">
        <TextBox
          type="number"
          bind:value={currentUser.ntkDetails.age}
          label="Age"
          minWidth={150}
          errorMessage="Please enter a number for your age" />
        <TextBox
          type="email"
          bind:value={currentUser.ntkDetails.email}
          label="Email"
          minWidth={350}
          errorMessage="Please enter a valid email address" />
        <TextBox
          class="about-me"
          isTextArea={true}
          bind:value={currentUser.ntkDetails.moreDetails.about}
          label="About Me" />
        <TextBox
          bind:value={currentUser.ntkDetails.moreDetails.hobbies}
          label="Hobbies (seperated with commas)"
          minWidth={350} />
      </div>
      <div class="form-details-column">
        <TextBox
          type="number"
          bind:value={currentUser.ntkDetails.age}
          label="Age"
          minWidth={150}
          errorMessage="Please enter a number for your age" />
        <TextBox
          type="email"
          bind:value={currentUser.ntkDetails.moreDetails.email}
          label="Email"
          minWidth={350}
          errorMessage="Please enter a valid email address" />
        <TextBox
          class="about-me"
          isTextArea={true}
          bind:value={currentUser.ntkDetails.moreDetails.about}
          label="About Me" />
        <TextBox
          bind:value={currentUser.ntkDetails.moreDetails.hobbies}
          label="Hobbies (seperated with commas)"
          minWidth={350} />
      </div>

    </div>
  </div>
  <Actions class="actions">
    <Button color="secondary" variant="raised" >
      <Label>Cancel</Label>
    </Button>
    <Button variant="raised" on:click={submit}>
      <Label>Submit</Label>
    </Button>

  </Actions>
</Dialog>
