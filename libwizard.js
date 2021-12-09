function fixAll() {
    // remove aria-live attribute from questions
    $("libwizard-question div").removeAttr("aria-live");

    // turn "label span p" into "label span"
    $("label span p").each(function() {
        $(this).replaceWith(this.innerText);
    });

    // TODO: email question

    // TODO: date question (format, range)

    // radio question
    $(".f-radio mat-radio-button label").each(function() {
        let span = createRadioButtonSpan($(this).find("input"), this.innerText);
        $(this).children().remove();
        $(this).append(span);
    });

    // checkbox question
    $(".f-chkbox").each(function() {
        // group checkboxes in a fieldset, and make label a legend
        $(this).wrap("<fieldset></fieldset>");
        $(this).parent().prepend("<legend>" + $(this).find("label").get(0).innerHTML + "</legend>");
        $(this).find("label").first().remove();
    });
    $(".f-chkbox mat-checkbox label").each(function() {
        let span = createCheckboxSpan($(this).find("input"), $(this).find("svg"), this.innerText);
        $(this).children().remove();
        $(this).append(span.children());
    });

    // grid question
    $(".f-grid").each(function() { fixGrid(this); });

    // TODO: ranking question

    // TODO: Remove placeholders

    // TODO: Alerts

    applyTemporaryCss();
}
fixAll();

// TODO: Reapply when content changes to do screen size or button press
// TODO: Ensure that this works for small screens (mostly concerned about grid)

// provide input element and radio button label text
// returns span that should replace the children of the button's label element
// fixes: replaces divs (nested incorrectly inside label element) with spans, prevents VoiceOver "and one more item" issue
function createRadioButtonSpan(input, label_text) {
    let span = $('<span class="mat-radio-container"><span class="mat-radio-outer-circle"></span><span class="mat-radio-inner-circle"></span></span>');
    span.append(input);
    span.append('<span matripple class="mat-ripple mat-radio-ripple mat-focus-indicator"><span class="mat-ripple-element mat-radio-persistent-ripple"></span></span>');
    span.append('<span class="mat-radio-label-content radio-label choice-text">' + label_text + '</span>');
    return span;
}

// provide input element, svg element, and checkbox label text
// returns span with children that should replace the children of the checkbox's label element
// fixes: replaces divs (nested incorrectly inside label element) with spans, prevents VoiceOver "and one more item" issue
function createCheckboxSpan(input, svg, label_text) {
    let span = $('<span><span class="mat-checkbox-inner-container"></span></span>');
    span.append(input);
    span.children(".mat-checkbox-inner-container")
        .append('<span matripple class="mat-ripple mat-checkbox-ripple mat-focus-indicator"><span class="mat-ripple-element mat-checkbox-persistent-ripple"></span></span>')
        .append('<span class="mat-checkbox-frame"></span>')
        .append('<span class="mat-checkbox-background"></span>');
    span.find(".mat-checkbox-background").append(svg);
    span.append('<span class="mat-checkbox-mixedmark"></span>');
    span.append('<span class="mat-checkbox-label">' + label_text + '</span>');
    return span;
}

function fixGrid(grid) {
    // set some needed variables
    let grid_label = $(grid).find("label").first();
    let grid_label_text = grid_label.get(0).innerText; // TODO: will include required label if present?
    let grid_id = grid_label.attr("for").replace("-group", "");
    let ng = getVariableAttribute(grid_label.get(0));
    let col_header = $(grid).find(".f-grid-col").children();
    // build better label: replace label element with span, remove paragraph element from within span
    grid_label.children().first().replaceWith("<span>" + grid_label.children().get(0).innerText + "</span>"); // would not include required label
    let new_label = $("<span></span>");
    new_label.attr("class", grid_label.attr("class")).attr(ng, "").append(grid_label.children());
    grid_label.replaceWith(new_label);
    
    let is_radio = !grid_label_text.startsWith("Choose all that apply");
    $(grid).find(".f-grid-row").each(function() {
        let row_label_text = $(this).children().get(0).innerText;
        let row_id = $(this).children().first().attr("id").replace("-label", "");
        if (is_radio) {
            // make a radiogroup
            $(this).attr("aria-labelledby", row_id + "-label").attr("role", "radiogroup");
            $(this).children().get(0).innerText = '';
            $(this).children().first().append(
                $('<label id="' + row_id + '-label"></label>')
                    .append('<span class="sr-only">' + grid_label_text + ', </span>')
                    .append('<span>' + row_label_text + '</span>')
            );
        } else {
            // make a checkbox fieldset
            let fieldset = $('<fieldset ' + ng + ' class="row f-grid-row"></fieldset>');
            fieldset.append('<legend class="sr-only">' + grid_label_text + ', ' + row_label_text + '</legend>')
                .append('<div ' + ng + ' ngclass.lt-md="text-24" aria-hidden="true" class="col text-16 choice-text"><span>' + row_label_text + '</span></div>')
                .append($(this).children(":not(:first-child)")); // move over all of the rows
            $(this).replaceWith(fieldset);
        }
        // inputs (using loop because I need the index)
        let inputs = $(this).find("mat-checkbox");
        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            let input_label_text = col_header.get(i+1).innerText;
            if (is_radio) {
                let checkbox_input = $(input).find("input").css("display", "none"); // keep but hide old input
                let radio_button = $('<mat-radio-button ' + ng + ' class="mat-radio-button responsive _mat-animation-noopable mat-accent"></mat-radio-button>')
                    .append('<label class="mat-radio-label"></label>');
                let span = createRadioButtonSpan(
                    $('<input type="radio" class="mat-radio-outer-circle" name="' + row_id + '" value="' + input_label_text + '" data-refersto="' + checkbox_input.get(0).id + '" aria-checked="false">'),
                    input_label_text);
                // a few modifications (and an event handler)
                span.find(".mat-ripple-element").addClass("mat-radio-ripple");
                span.find(".mat-radio-label-content").addClass("sr-only");
                span.find("input").on("change", function() { handleRadioChange(this); });
                span.append(checkbox_input);
                radio_button.children("label").append(span);
                $(input).replaceWith(radio_button);
                // TODO: Adjust radio button if checkbox was already checked (on reapply)
            } else {
                $(input).removeAttr("aria-labelledby");
                let span = createCheckboxSpan($(input).find("input"), $(input).find("svg"), input_label_text);
                // a few modifications
                span.find(".mat-ripple-element").addClass("mat-checkbox-ripple");
                span.find(".mat-checkbox-label").addClass("sr-only");
                $(input).children().remove();
                $(input).append(span.children());
            }
        }
    });
}

function handleRadioChange(radio) {
    let parent = $(radio).parents(".f-grid-row");
    parent.find("input[type=radio]").attr("aria-checked", "false"); // make sure all other radio buttons have value of false
    $(radio).attr("aria-checked", "true"); // but this one should have true
    parent.find("#" + $(radio).attr("data-refersto")).click(); // pass change to the old input
}

function getVariableAttribute(element) {
    let attributes = element.getAttributeNames();
    for (let a of attributes) {
        if (a.startsWith("_ngcontent-")) return a;
    }
}

// TODO: Move to CSS file, also include needed general CSS modifications
function applyTemporaryCss() {
    // radio buttons
    $(".f-radio .mat-radio-label-content").css("padding-left", "28px");
    // TODO: Don't think last radio buttons lines up quite right

    // checkboxes
    $(".mat-checkbox-input").css("bottom", "unset").css("left", "unset");
    // TODO: Legend is now much larger than the label was

    // grid
    $(".f-grid input").css("cursor", "pointer");
    $(".flex-grow .row.f-grid-row .col:first-of-type").css("flex-grow", "3").css("padding", ".2222rem 0");
    // TODO: I don't think I actually like the padding - maybe remove it from radiogroup instead??
    // TODO: Fix formatting issue where checkboxes don't really line up with the column headers (issue from original site, not added by this code)
    // TODO: Radio buttons don't match non-grid radio buttons (esp. not on Chrome) - need to normalize
}
