<script>
    import { createEventDispatcher } from 'svelte';
    import Paper, {Title, Subtitle} from '@smui/paper';
    import Card, {Content, PrimaryAction, Media, MediaContent, Actions, ActionButtons, ActionIcons} from '@smui/card';
    import IconButton, {Icon} from '@smui/icon-button';
    import Button, {Label} from '@smui/button';
    import Avatar from '../common/Avatar.svelte';

    let clicked=0;
    const dispatch = createEventDispatcher();

    export let ntkPerson={
        ntkDetails: {
            id : 'id-1',
            name : 'Nkt name',
            age : 25,
            imageUrl : "https://encrypted-tbn0.gstatic" +
                    ".com/images?q=tbn%3AANd9GcRu5trhUbXDbD2aQdTKFUERRxeYQH-98QIX59tug8132E-gz6Oo&usqp=CAU",
            moreDetails : {
                hobbies : 'Skating, joggling'
            }
        },
        isMarked: true,
        hasAccepted: false
    }

    function onMarkedChanged() {
        dispatch('markedChanged', {id: ntkPerson.ntkDetails.id});
    }
</script>

<style type="text/scss">
    .content {

    }

    :global(.mdc-typography--body2), :global(.mdc-typography--caption) {
        font-family: Roboto, sans-serif;
        -moz-osx-font-smoothing: grayscale;
        -webkit-font-smoothing: antialiased;
        line-height: 1.25rem;
        font-weight: 400;
        text-decoration: inherit;
        text-transform: inherit;
    }

    :global(.mdc-typography--headline6) {
        font-size: 1.25rem;
        font-weight: 500;
        letter-spacing: .0125em;
    }

    :global(.mdc-typography--subtitle1), :global(.mdc-typography--subtitle2) {
        font-family: Roboto, sans-serif;
        -moz-osx-font-smoothing: grayscale;
        -webkit-font-smoothing: antialiased;
        text-decoration: inherit;
        text-transform: inherit;
    }

    .card-details {
        padding: 0 15px;
    }

    .avatar-container {
        display: flex;
        height: 120px;
        width: 100%;
        justify-content: space-between;
        align-items: center;
        border-bottom: solid 1px #ececec;

        .person-details {
            width: 200px;

            h3, h5 {
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

    :global(.toggle-button) {
        display: none;
    }
    :global(.toggle-button.active){
        display: block;
    }

</style>

<div class="my-card">
    <Card style="width: 360px;">
        <div class="card-details">
            <div class="avatar-container">
                <Avatar imageUrl={ntkPerson.ntkDetails.imageUrl}/>
                <div class="person-details">
                    <h3 class="ntk-name">
                        {ntkPerson.ntkDetails.name}
                    </h3>
                    <h5 class="ntk-age">
                        <span>Age:</span>
                        <span>{ntkPerson.ntkDetails.age}</span>
                    </h5>
                </div>

            </div>
            <div class="ntk-details-rows-container">
                <div class="ntk-details-row">
                    <div class="caption">Hobbies</div>
                    <div class="details"> {ntkPerson.ntkDetails.moreDetails.hobbies}</div>
                </div>
            </div>

        </div>
        <Actions>
            <ActionButtons>
                <Button on:click={() => clicked++}>
                    <Label>Action</Label>
                </Button>
                <Button on:click={() => clicked++}>
                    <Label>Another</Label>
                </Button>
            </ActionButtons>
            <ActionIcons>
                <IconButton on:click={() => onMarkedChanged()}  aria-label="Add to favorites" title="Add to
                favorites">
                    <Icon
                            class="material-icons toggle-button {ntkPerson.isMarked ? 'active' : ''}">favorite</Icon>
                    <Icon
                          class="material-icons toggle-button {!ntkPerson.isMarked ? 'active' :
                          ''}">favorite_border</Icon>
                </IconButton>
                <IconButton class="material-icons" on:click={() => clicked++} title="Share">share</IconButton>
                <IconButton class="material-icons" on:click={() => clicked++} title="More options">more_vert
                </IconButton>
            </ActionIcons>
        </Actions>
    </Card>
</div>
