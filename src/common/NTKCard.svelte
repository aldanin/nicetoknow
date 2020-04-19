<script>
    import { createEventDispatcher } from 'svelte';
    import Card, {Content, PrimaryAction, Media, MediaContent, Actions, ActionButtons, ActionIcons} from '@smui/card';
    import IconButton from '@smui/icon-button';
    import Button, {Label} from '@smui/button';
    import Avatar from './Avatar.svelte';
    import ToggleButton from './ToggleButton.svelte';

    let clicked=0;
    const dispatch = createEventDispatcher();

    export let ntkPerson;
    export let isApproval=false;

    function onMarkedChanged() {
        dispatch('markedChanged', {id: ntkPerson.ntkDetails.id});
    }

    function onCardDblclick() {
        dispatch('ntkPersonSelected', ntkPerson)
    }

    function setApproval(isApproved) {
        dispatch('approvalChanged', {id: ntkPerson.ntkDetails.id, isApproved})
    }

    $: console.log('ntkPerson', ntkPerson)
</script>

<style type="text/scss">
    .content {

    }

    :global(.is-approved) {
        background-color: pink;
    }

    :global(.up) {
        color: limegreen;
    }

    :global(.down) {
        color: #a70000;
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

    .my-card {
        width: 650px;
    }

    .card-details {
        padding: 0 15px;
    }

    .avatar-container {
        display: flex;
        height: 120px;
        width: 100%;
        justify-content: left;
        align-items: center;
        border-bottom: solid 1px #ececec;
        cursor: pointer;

        .person-details {
            margin-left: 30px;
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
            margin-bottom: 10px;

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

<div class="my-card">
    <Card class="card-theme {ntkPerson.isApproved ? 'is-approved' : ''}">
        <div class="card-details" on:dblclick={onCardDblclick}>
            <div class="avatar-container">
                <Avatar imageUrl={ntkPerson.ntkDetails.imageUrl}/>
                <div class="person-details">
                    <h3 class="ntk-name">
                        {ntkPerson.ntkDetails.name}
                    </h3>
                    {#if ntkPerson.ntkDetails.age}
                    <h5 class="ntk-age">
                        <span>Age:</span>
                        <span>{ntkPerson.ntkDetails.age}</span>
                    </h5>
                    {/if}
                </div>

            </div>
            <div class="ntk-details-rows-container">
                <div class="ntk-details-row">
                    <div class="caption">About Me</div>
                    <div class="details"> {ntkPerson.ntkDetails.moreDetails.aboutMe}</div>
                </div>
                <div class="ntk-details-row">
                    <div class="caption">Hobbies</div>
                    <div class="details"> {ntkPerson.ntkDetails.moreDetails.hobbies}</div>
                </div>
            </div>

        </div>
        <Actions>
            <ActionButtons>
                <Button
                        on:click={() => clicked++}
                        variant="raised"
                        color="secondary"
                >
                    <Label>Action</Label>

                </Button>
            </ActionButtons>
            <ActionIcons>
                {#if !isApproval}
                    <ToggleButton
                            markedIcon="favorite"
                            unmarkedIcon="favorite_border"
                            on:click="{() => onMarkedChanged()}"
                            isMarked="{ntkPerson.isMarked}"
                            title="Mark as potential nice-to-know"
                    />
                {/if}
                {#if isApproval}
                    <IconButton class="material-icons up" on:click={() => setApproval(true)}
                                title="approve">thumb_up_alt</IconButton>
                    <IconButton class="material-icons down" on:click={() => setApproval(false)}
                                title="disapprove">thumb_down_alt</IconButton>
                {/if}
                <IconButton class="material-icons" on:click={() => clicked++} title="More options">more_vert
                </IconButton>
            </ActionIcons>
        </Actions>
    </Card>
</div>
