function fixAll() {
    // what needs to happen depends on which page we are on
    // if quiz page and content has been moved out of the form, content needs to move back in
    if ($("libwizard-question").length > 0) {
        if ($("form").children().length === 0) {
            $("form").append($("main").children().first());
            $("form").removeAttr("aria-hidden");
        }
        fixQuiz();
    } else if ($("form").children().length > 0) {
        // otherwise we're not in a quiz, so nothing should be in the form
        $("form").before($("form").children().css("width", "100%"));
        $("form").children().remove();
        $("form").attr("aria-hidden", "true");
    }

    // TODO: Set to reapply on buttons - not sure if this is optimal wait time, also doesn't work so well if there are errors preventing proceeding, so will need to deal with that...
    $("button").on("click", function() {
        setTimeout(fixAll, 100);
    });
}

// TODO: Note to consider: I might be able to do some tests before applying a function. For example, before setting up a fieldset for a group of checkboxes, I could make sure a fieldset doesn't already exist for some reason. This could be helpful...

function fixQuiz() {
    // remove aria-live attribute from questions
    $("libwizard-question div").removeAttr("aria-live");

    // turn "label span p" into "label span"
    $("label span p").each(function() {
        $(this).replaceWith(this.innerText);
    });

    // TODO: Remove event listeners from inputs?

    // Question Types
    // Number: Broken aria reference with aria-describedby
    $(".f-num input").removeAttr("aria-describedby");
    // Date: Does not use date type, date range is not indicated, date format... something
    fixDate();
    // Radios: Not in fieldset, parsing error, VoiceOver "and one more item"
    $(".f-radio").each(wrapInputsInFieldset).each(fixRadioGroup);
    $(".f-radio mat-radio-button label").each(fixRadioButton);
    // Checkboxes: Not in fieldset, parsing error, VoiceOver "and one more item"
    $(".f-chkbox").each(wrapInputsInFieldset);
    $(".f-chkbox mat-checkbox label").each(fixCheckbox);
    // Grid
    $(".f-grid").each(fixGrid);
    // Ranking
    $(".f-rating").each(fixRanking);
    // Email: Domain restrictions
    $(".f-email").each(fixEmail);

    // TODO: Enforce anything?

    // Remove placeholders
    $("input").removeAttr("placeholder");

    // TODO: Fix alerts (required, require correct answer to continue, domain restrictions, date range) (maybe)

    // TODO: Set to reapply certain code on size shift (I know grid changes, at least)

    applyTemporaryCss();
}
fixAll();

// TODO
function fixDate() {
    // TODO: date question (format, range)
    // $(".f-date").each(function() {
    //     let input = $(this).find("input");
    //     let placeholder = input.attr("placeholder");
    //     input.attr("data-date_format", getDateFormat(placeholder)).attr("type", "date");
    // });
    // $(".f-date input").on("input", function(e) {
    //     if (e.originalEvent.data !== null) handleDateInput(e);
    // });
    // for (let obj of $("input[type='date']")) {
    //     let e = getEventListeners(obj)['blur'][0];
    //     obj.removeEventListener('input', e.listener, e.useCapture);
    // }
    // $(".f-date input").on("blur", function(e) {
    //     handleDateInput(e);
    // });
    // function handleDateInput(e) {
    //     let target = e.originalEvent.target;
    //     target.value = getDateValue(target.value, target.getAttribute('data-date_format'));
    // }
}

/**
 * "this" should be a checkbox or radio group to be wrapped
 */
function wrapInputsInFieldset() {
    $(this).wrap("<fieldset></fieldset>");
    $(this).parent().prepend("<legend>" + $(this).find("label").get(0).innerHTML + "</legend>");
    $(this).find("label").first().remove();
}

function fixRadioGroup() {
    let group = $(this).find("mat-radio-group");
    let fieldset = $(this).parent();
    // fieldset needs role of radio group, possibly needs required
    fieldset.attr("role", "radiogroup");
    if (group.attr("aria-required")) fieldset.attr("aria-required", "true").attr("required", "");
    // remove role, aria-labelledby, and required
    group.removeAttr("role").removeAttr("aria-labelledby").removeAttr("aria-required").removeAttr("required");
}

function fixRadioButton() {
    let span = createRadioButtonSpan($(this).find("input"), this.innerText);
    $(this).children().remove();
    $(this).append(span);
}

function fixCheckbox() {
    let span = createCheckboxSpan($(this).find("input"), $(this).find("svg"), this.innerText);
    $(this).children().remove();
    $(this).append(span.children());
}

function fixRanking() {
    //
}

function fixEmail() {
    let input = $(this).find("input");
    let placeholder = input.attr("placeholder");
    if (placeholder) {
        let id = input.attr("id") + "-description";
        input.attr("aria-describedby", id);
        $('<div id="' + id + '">' + placeholder + '</div>').insertAfter($(this).find("label"));
    }
}

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

function fixGrid() {
    let label = $(this).find("label").first();
    let grid_label_text = label.get(0).innerText; // TODO: Will included required label if present?
    let ng = getVariableAttribute(label.get(0));
    let col_header = $(this).find(".f-grid-col").children();
    fixGridLabel(label, ng);
    $(this).find(".f-grid-row").each(function() {
        let row_label_text = $(this).children().get(0).innerText;
        let row_id = $(this).children().first().attr("id").replace("-label", "");
        // fieldset
        let fieldset = $('<fieldset ' + ng + ' class="row f-grid-row"></fieldset>');
        fieldset.append('<legend class="sr-only">' + grid_label_text + ', ' + row_label_text + '</legend>')
            .append('<div ' + ng + ' ngclass.lt-md="text-24" aria-hidden="true" class="col text-16 choice-text"><span>' + row_label_text + '</span></div>')
            .append($(this).children(":not(:first-child)")); // move over all of the rows
        $(this).replaceWith(fieldset);
        // radio buttons/checkboxes - using loop because I need the index
        let cols = $(fieldset).find("mat-checkbox");
        for (let i = 0; i < cols.length; i++) {
            let col = cols[i];
            let input_label_text = col_header.get(i+1).innerText;
            if (grid_label_text.startsWith("Choose all that apply")) {
                // multiple answers per row - checkboxes
                $(col).removeAttr("aria-labelledby");
                let span = createCheckboxSpan($(col).find("input"), $(col).find("svg"), input_label_text);
                // a few modifications
                span.find(".mat-ripple-element").addClass("mat-checkbox-ripple");
                span.find(".mat-checkbox-label").addClass("sr-only");
                $(col).children("label").children().remove();
                $(col).children("label").append(span.children());
            } else {
                // radio buttons
                let checkbox_input = $(col).find("input").css("display", "none").attr("aria-hidden", "true").attr("aria-label", "ignore this input"); // keep but hide old input
                let checkbox_id = checkbox_input.get(0).id;
                let radio_button = $('<mat-radio-button ' + ng + ' class="mat-radio-button responsive _mat-animation-noopable mat-accent"></mat-radio-button>')
                    .append('<label class="mat-radio-label" for="' + checkbox_id + '-radio"></label>');
                let span = createRadioButtonSpan(
                    $('<input type="radio" id="' + checkbox_id + '-radio" class="mat-radio-outer-circle" name="' + row_id + '" value="' + input_label_text + '" data-refersto="' + checkbox_id + '" aria-checked="false">'),
                    input_label_text);
                // a few modifications (and an event handler)
                span.find(".mat-ripple-element").addClass("mat-radio-ripple");
                span.find(".mat-radio-label-content").addClass("sr-only");
                span.find("input").on("change", function() { handleRadioChange(this); });
                span.append(checkbox_input);
                radio_button.children("label").append(span);
                $(col).replaceWith(radio_button);
                // TODO: Adjust radio button if checkbox was already checked (on reapply)
            }
        }
    });
}
function fixGridLabel(label, ng) {
    // build better label: replace label element with span, remove paragraph element from within span
    label.children().first().replaceWith("<span>" + label.children().get(0).innerText + "</span>"); // would not include required label
    let new_label = $("<span></span>");
    new_label.attr("class", label.attr("class")).attr(ng, "").append(label.children());
    label.replaceWith(new_label);
}

/*function fixGrid() {
    let grid = this;
    // set some needed variables
    let grid_label = $(grid).find("label").first();
    let grid_label_text = grid_label.get(0).innerText; // TODO: will include required label if present?
    //let grid_id = grid_label.attr("for").replace("-group", "");
    let ng = getVariableAttribute(grid_label.get(0));
    let col_header = $(grid).find(".f-grid-col").children();
    
    let is_radio = !grid_label_text.startsWith("Choose all that apply");
    $(grid).find(".f-grid-row").each(function() {
        let row_label_text = $(this).children().get(0).innerText;
        let row_id = $(this).children().first().attr("id").replace("-label", "");
        // fieldset
        let fieldset = $('<fieldset ' + ng + ' class="row f-grid-row"></fieldset>');
        fieldset.append('<legend class="sr-only">' + grid_label_text + ', ' + row_label_text + '</legend>')
            .append('<div ' + ng + ' ngclass.lt-md="text-24" aria-hidden="true" class="col text-16 choice-text"><span>' + row_label_text + '</span></div>')
            .append($(this).children(":not(:first-child)")); // move over all of the rows
        $(this).replaceWith(fieldset);
        if (is_radio) fieldset.attr("role", "radiogroup");
        // if (is_radio) {
        //     // make a radiogroup
        //     $(this).attr("aria-labelledby", row_id + "-label").attr("role", "radiogroup");
        //     $(this).children().get(0).innerText = '';
        //     $(this).children().first().append(
        //         $('<label id="' + row_id + '-label"></label>')
        //             .append('<span class="sr-only">' + grid_label_text + ', </span>')
        //             .append('<span>' + row_label_text + '</span>')
        //     );
        // } else {
        //     // make a checkbox fieldset
        //     let fieldset = $('<fieldset ' + ng + ' class="row f-grid-row"></fieldset>');
        //     fieldset.append('<legend class="sr-only">' + grid_label_text + ', ' + row_label_text + '</legend>')
        //         .append('<div ' + ng + ' ngclass.lt-md="text-24" aria-hidden="true" class="col text-16 choice-text"><span>' + row_label_text + '</span></div>')
        //         .append($(this).children(":not(:first-child)")); // move over all of the rows
        //     $(this).replaceWith(fieldset);
        // }
        // inputs (using loop because I need the index)
        let inputs = $(fieldset).find("mat-checkbox");
        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            let input_label_text = col_header.get(i+1).innerText;
            if (is_radio) {
                let checkbox_input = $(input).find("input").css("display", "none").attr("aria-hidden", "true").attr("aria-label", "ignore this input"); // keep but hide old input
                let checkbox_id = checkbox_input.get(0).id;
                let radio_button = $('<mat-radio-button ' + ng + ' class="mat-radio-button responsive _mat-animation-noopable mat-accent"></mat-radio-button>')
                    .append('<label class="mat-radio-label" for="' + checkbox_id + '-radio"></label>');
                let span = createRadioButtonSpan(
                    $('<input type="radio" id="' + checkbox_id + '-radio" class="mat-radio-outer-circle" name="' + row_id + '" value="' + input_label_text + '" data-refersto="' + checkbox_id + '" aria-checked="false">'),
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
                $(input).children("label").children().remove();
                $(input).children("label").append(span.children());
            }
        }
    });
}*/

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
