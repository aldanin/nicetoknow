<script>
  import { createEventDispatcher, onMount } from "svelte";
  import TextBox from "../common/TextBox.svelte";
  import Dialog, { Title, Content, Actions, InitialFocus } from "@smui/dialog";
  import Button, { Label } from "@smui/button";
  import Avatar from "../common/Avatar.svelte";
  import FileUpload from "sveltefileuploadcomponent";
  import { BLM } from "../BLM/BLM";
  import NTKMap from "../common/NTKMap.svelte";

  export let ntkPerson;
  let simpleDialog;
  let location;

  $: {
    const lat =
      ntkPerson.ntkDetails.moreDetails &&
      ntkPerson.ntkDetails.moreDetails.location &&
      ntkPerson.ntkDetails.moreDetails.location.coordinates &&
      ntkPerson.ntkDetails.moreDetails.location.coordinates.latitude;
    const lon =
      ntkPerson.ntkDetails.moreDetails &&
      ntkPerson.ntkDetails.moreDetails.location &&
      ntkPerson.ntkDetails.moreDetails.location.coordinates &&
      ntkPerson.ntkDetails.moreDetails.location.coordinates.longitude;
    location =
      lat && lon
        ? {
            lat : +lat,
            lon: +lon,
            label: `${ntkPerson.ntkDetails.moreDetails.location.country}, ${ntkPerson.ntkDetails.moreDetails.location.state}, ${ntkPerson.ntkDetails.moreDetails.location.city}`
          }
        : null;
  }

  const dispatch = createEventDispatcher();

  onMount(() => {
    simpleDialog.open();
  });

  async function gotFiles(event) {
    const data = await getBase64(event.detail.files[0]);
    console.log("vase84", data);
    ntkPerson.ntkDetails.imageUrl = data;
  }

  function closeHandler(e) {
    dispatch("dialogClosed", e);
  }

  function submit(e) {
    BLM.updateUserDetails(ntkPerson.ntkDetails);
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

  .person-details {
    display: flex;
    justify-content: space-between;

    .person-details-column {
      width: 400px;

      .ntk-detail {
        color: gray;
        .caption {
          color: #b5b5b5;
          padding-right: 5px;
          font-weight: bold;
        }
        .detail {
          font-style: italic;
        }
      }
    }
  }

  .map-container {
    height: 230px;
    margin: 20px 0;
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
    cursor: default;

    .name-div {
      margin-left: 20px;
      font-size: 200%;
      font-weight: bold;
      color: #989898;
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
  <!-- <header class="header">Update User Details</header> -->
  <div class="card-details">
    <div class="avatar-container">
     <Avatar imageUrl={ntkPerson.ntkDetails.imageUrl} height="100px" />

      <div class="name-div">{ntkPerson.ntkDetails.name}</div>
    </div>
    <div class="person-details">
      <div class="person-details-column">
        <h5 class="ntk-detail">
          <span class="caption">Age:</span>
          <span class="detail">{ntkPerson.ntkDetails.age}</span>
        </h5>

        <h5 class="ntk-detail">
          <span class="caption">About:</span>
          <span class="detail">{ntkPerson.ntkDetails.moreDetails.about}</span>
        </h5>
        <h5 class="ntk-detail">
          <span class="caption">Hobbies:</span>
          <span class="detail">{ntkPerson.ntkDetails.moreDetails.hobbies}</span>
        </h5>
      </div>
      <div class="person-details-column">
        <div class="map-container">
          <NTKMap mapDetails={location} />
        </div>
        <h5 class="ntk-detail">
          <span class="caption">Hobbies:</span>
          <span class="detail">{ntkPerson.ntkDetails.moreDetails.hobbies}</span>
        </h5>
      </div>

    </div>
  </div>
  <Actions class="actions">
    <Button color="secondary" variant="raised">
      <Label>Close</Label>
    </Button>
  </Actions>
</Dialog>
