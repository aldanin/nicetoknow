<script>
    import Textfield, {Input, Textarea} from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text/index';

    export let errorMessage='';
    export let label = '';
    export let minWidth=250;
    let valueClickable='';
    let dirtyClickable=false;
    let invalidClickable=false;


</script>

<style>

</style>

<Textfield type="email"
           withTrailingIcon={valueClickable !== ''}
           bind:dirty={dirtyClickable}
           bind:invalid={invalidClickable}
           updateInvalid
           bind:value={valueClickable}
           label="{label}"
           style="min-width: 250px;"

>
</Textfield>
<HelperText validationMsg>{errorMessage}</HelperText>

<!--           input$autocomplete="email"-->
