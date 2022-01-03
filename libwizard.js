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

    // TODO: Set to reapply on buttons - not sure if this is optimal wait time, also doesn't work so well if there are errors preventing proceeding, so will need to deal with that... basically need to be more specific about which buttons...
    $('button').each(function() {
        if (!$(this).hasClass('browse')) $(this).on('click', function() { setTimeout(fixAll, 100); });
    });
    // $("button").on("click", function() {
    //     setTimeout(fixAll, 100);
    // });

    $('body').addClass('theo-test');
    setTimeout(applyTemporaryCss, 150);
}

// TODO: Note to consider: I might be able to do some tests before applying a function. For example, before setting up a fieldset for a group of checkboxes, I could make sure a fieldset doesn't already exist for some reason. This could be helpful...

function fixQuiz() {
    // remove aria-live attribute from questions
    $("libwizard-question div").removeAttr("aria-live");

    // turn "label span p" into "label span"
    $("label span p").each(function() {
        $(this).replaceWith(this.innerText);
    });

    // Pull title and possibly text block out of form element
    let text = $('<div class="form-top"></div>');
    $('form').before(text);
    text.append($('h1'));
    let q1 = $('libwizard-question').first();
    if (q1.find('.f-text-block').length > 0) text.append(q1);

    // TODO: Remove event listeners from inputs?

    // Question Types
    $(".f-input").each(fixTextInput);
    $(".f-multi").each(fixTextarea);
    $(".f-num").each(fixNumberInput);
    $(".f-date").each(fixDate);
    $('.f-dropdown').each(fixSelect);
    $(".f-radio").each(fixRadioGroup);
    $(".f-chkbox").each(fixCheckboxGroup);
    // Grid
    $(".f-grid").each(fixGrid);
    // Ranking
    $(".f-rating").each(fixRanking);
    $(".f-email").each(fixEmail);
    $('.f-name').each(fixName);

    // TODO: Enforce anything?

    // Remove placeholders
    $("input").removeAttr("placeholder");

    // TODO: Fix alerts (required, require correct answer to continue, domain restrictions, date range) (maybe)

    // TODO: Set to reapply certain code on size shift (I know grid changes, at least)

}
fixAll();

/* --------------- Fixes for Questions by Type --------------- */

// just replacing the input element for now
function fixTextInput() {
    let q = $(this);
    let old_input = q.find('input').first();
    let label = q.find('label').first();
    let new_input = replaceInput(old_input, label);

    if (new_input.get(0).required) {
        // add description area
        addDescription(new_input, label, '', true);
        // add event handler
        new_input.on('focusout', function() { validateRequired(this); });
    }
}
function fixTextarea() {
    let old_input = $(this).find('textarea').first();
    let label = $(this).find('label').first();
    let new_input = replaceInput(old_input, label);

    if (new_input.get(0).required) {
        // add description area
        addDescription(new_input, label, '', true);
        // add event handler
        new_input.on('focusout', function() { validateRequired(this); });
    }
}
// replacing input element and remove broken aria reference with aria-describedby
function fixNumberInput() {
    let old_input = $(this).find('input').first();
    let label = $(this).find('label').first();

    old_input.removeAttr('aria-describedby');
    let new_input = replaceInput(old_input, label);

    if (new_input.get(0).required) {
        // add description area
        addDescription(new_input, label, '', true);
        // add event handler
        new_input.on('focusout', function() { validateRequired(this); });
    }
}
// replace input element, add date format description, add simple input mask
function fixDate() {
    let old_input = $(this).find('input').first().removeAttr('aria-label');
    let label = $(this).find('label').first();
    let new_input = replaceInput(old_input, label, false);

    addDescription(new_input, label, 'Date must be in <span aria-hidden="true">mm/dd/yyyy</span><span class="sr-only">MM/DD/YYYY</span> format.', true);

    // input mask
    new_input.on('input', function(e) { handleDateInput(e); });

    if (new_input.get(0).required) new_input.on('focusout', function() { validateRequired(this); });
    new_input.on('focusout', function() { validateDate(this); });

    // TODO: Some day make datepicker work
    $(this).find('button').remove();
    // let btn = $(this).find('button');
    // let r = new_input.get(0).getBoundingClientRect();
    // btn.css('transform', 'translateX(' + Math.round(r.width) + 'px)');
    // btn.attr('data-input_id', old_input.attr('id'));
    // btn.on('click', function() {
    //     let datepicker = $('ngb-datepicker').attr('data-input_id', this.getAttribute('data-input_id'));
    //     datepicker.on('click', function() {
    //         let old_input = $('#' + this.getAttribute('data-input_id')).get(0);
    //         if (old_input.value) {
    //             let new_input = $('#' + this.getAttribute('data-input_id') + '-new').get(0);
    //             if (old_input.value !== new_input.value) new_input.value = old_input.value;
    //         }
    //     })
    // });
}
// just replacing input element for now
function fixSelect() {
    let select = $(this);
    let old_input = select.find('select').first();
    let label = select.find('label').first();
    let new_input = replaceInput(old_input, label, false);
    new_input.on('change', function(e) { handleChangeEvent(e); });

    if (new_input.get(0).required) {
        // add description area
        addDescription(new_input, label, '', true);
        // add event handler
        new_input.on('focusout', function() { validateRequired(this); });
    }
}
// fieldset, parsing error, VoiceOver 'and one more item'
function fixRadioGroup() {
    let fieldset = wrapWithFieldset($(this), $(this).find('label').first());
    fieldset.attr('role', 'radiogroup').addClass('standard');
    
    let group = $(this).find('mat-radio-group');
    if (group.attr("aria-required")) fieldset.attr("aria-required", "true").attr("required", "");
    // remove role, aria-labelledby, and required
    group.removeAttr("role").removeAttr("aria-labelledby").removeAttr("aria-required").removeAttr("required");
    // in case of required, remove special input
    $(this).children('.flex-grow').find('input').remove();

    // fix inputs
    $(this).find('mat-radio-button label').each(function() {
        let span = createRadioButtonSpan($(this).find('input'), this.innerText);
        $(this).children().remove();
        $(this).append(span);
    });
}
// replace group, fieldset, parsing error, VoiceOver 'and one more item'
function fixCheckboxGroup() {
    let fieldset = wrapWithFieldset($(this), $(this).find('label').first());
    fieldset.addClass('standard');
    // TODO: Determine if this removes special required input as it does for radio
    $(this).children('.flex-grow').find('input').remove();

    // fix inputs
    $(this).find('mat-checkbox label').each(function() {
        let span = createCheckboxSpan($(this).find("input"), $(this).find("svg"), this.innerText);
        $(this).children().remove();
        $(this).append(span.children());
    });
}
// TODO: Move fixGrid and fixRanking - they (esp. grid) may have additional changes to make for dealing with required...
// replace input, domain restrictions
function fixEmail() {
    let old_input = $(this).find('input');
    let label = $(this).find('label');
    let placeholder = old_input.attr('placeholder');
    let new_input = replaceInput(old_input, label);
    addDescription(new_input, label, placeholder, true);

    if(new_input.get(0).required) new_input.on('focusout', function() { validateRequired(this); });
    new_input.on('focusout', function() { validateEmail(this); });
}
// replace input
function fixName() {
    let q = $(this);
    let old_input = q.find('input').first();
    let label = q.find('label').first();
    let new_input = replaceInput(old_input, label);

    if (new_input.get(0).required) {
        // add description area
        addDescription(new_input, label, '', true);
        // add event handler
        new_input.on('focusout', function() { validateRequired(this); });
    }
}

/* -------------------- Helper functions -------------------- */

// generic function for replacing a simple input with label
function replaceInput(old_input, label, add_listener=true) {
    // make a copy of the input element
    let new_input = $(old_input.get(0).cloneNode(true));

    // change id (and label reference if applicable)
    new_input.attr('id', old_input.attr('id') + '-new');
    if (label.length) label.attr('for', new_input.attr('id'));

    // insert the new input and hide the old one
    new_input.insertBefore(old_input);
    old_input.attr('aria-hidden', 'true').css('display', 'none').attr('aria-label', 'ignore this field');

    // add event listener
    if (add_listener) {
        new_input.on('input', function(e) {
            let input = e.currentTarget;
            let old_input = $(input).parent().find('#' + (input.id).replace('-new', '')).get(0);
            old_input.value = input.value;
            old_input.dispatchEvent(new Event('input'));
        });
    }

    return new_input;
}

function addDescription(input, label, msg, has_error=false) {
    let id = input.attr('id') + '-description';
    let desc = $('<div id="' + id + '" class="description"></div>');
    if (has_error) desc.append('<div role="alert" class="invalid-feedback"></div>');
    if (msg) desc.append('<div>' + msg + '</div>');
    desc.insertAfter(label);
    input.attr('aria-describedby', id);
    return desc;
}

function wrapWithFieldset(group, label) {
    group.wrap('<fieldset></fieldset>');
    group.parent().prepend('<legend>' + label.get(0).innerHTML + '</legend>');
    label.remove();
    return group.parent();
}

// replace divs (nested incorrectly inside label) with spans, prevent "and one more item"
// provide input element and radio button label text, returns span that should replace the children of the button's label element
function createRadioButtonSpan(input, label_text) {
    let span = $('<span class="mat-radio-container"><span class="mat-radio-outer-circle"></span><span class="mat-radio-inner-circle"></span></span>');
    span.append(input);
    span.append('<span matripple class="mat-ripple mat-radio-ripple mat-focus-indicator"><span class="mat-ripple-element mat-radio-persistent-ripple"></span></span>');
    span.append('<span class="mat-radio-label-content radio-label choice-text">' + label_text + '</span>');
    return span;
}
// provide input element, svg element, and checkbox label text, returns span with children that should replace the children of the checkbox's label element
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
function getVariableAttribute(element) {
    let attributes = element.getAttributeNames();
    for (let a of attributes) {
        if (a.startsWith("_ngcontent-")) return a;
    }
}
function handleAlert(input, text, valid) {
    let alert = $('#' + input.getAttribute('aria-describedby') + ' .invalid-feedback');
    if (!valid && !alert.text().includes(text)) {
        alert.text(text);
        // TODO: Determine if I should do something like the following to deal with situations (cough cough Safari cough cough) where ariadescribedby ignores anything inside role="alert" -- would also need to move the alert out of aria-describedby to prevent repetition in any moderately decent browser
        // TODO: Is it best to remove the invalid input or leave it there?
        // TODO: Is it best to reference the invalid value in the alert? (e.g. 'xx-xx-xxxx' is not a valid date)
        // alert.after('<span class="sr-only">' + text + '</span>');
    } else if (valid && alert.text().includes(text)) {
        alert.text('');
    }
}


/* -------------------- Event handlers -------------------- */

function handleInputEvent(e) {
    let input = e.currentTarget;
    let old_input = $(input).parent().find('#' + (input.id).replace('-new', '')).get(0);
    old_input.value = input.value;
    old_input.dispatchEvent(new Event('input'));
}
function handleDateInput(e) {
    let input = e.currentTarget;
    input.value = getDateValue(input.value);
    let old_input = $(input).parent().find('#' + (input.id).replace('-new', '')).get(0);
    old_input.value = input.value;
    old_input.dispatchEvent(new Event('input'));
}
function handleChangeEvent(e) {
    let input = e.currentTarget;
    let old_input = $(input).parent().find('#' + (input.id).replace('-new', '')).get(0);
    old_input.value = input.value;
    old_input.dispatchEvent(new Event('change'));
}
function handleRadioChange(radio) {
    radio = $(radio);
    let parent = radio.parents('.f-grid-row');
    parent.find('input[type=radio]').attr('aria-checked', 'false'); // make sure all other radio buttons have value of false
    radio.attr('aria-checked', 'true'); // but this one should have true
    parent.find('#' + radio.attr('data-refersto')).click(); // pass change to the old input
}
function validateRequired(input) {
    let text = 'This question is required. Please enter a value.';
    handleAlert(input, text, input.value);
}
function validateDate(input) {
    // moment.js is apparently included, this is good
    if (input.value) {
        let text = 'Please enter a valid date.';
        let m = moment(input.value, 'MM-DD-YYYY');
        handleAlert(input, text, m.isValid());
    }
}
function validateEmail(input) {
    if (input.value) {
        let text = 'Please enter a valid email address.';
        handleAlert(input, text, !$('#' + input.id.replace('-new', '')).hasClass('ng-invalid'));
    }
}



/* -------------------- Move These... -------------------- */

function fixRanking() {
    if ($(this).find("select").length === 0) return; // because ranking uses f-rating, so need to differentiate
    wrapWithFieldset($(this), $(this).find('label').first());
    //wrapInputsInFieldset(this);
    $(this).find("div").removeAttr("tabindex").removeAttr("aria-label");
    $(this).find("select").each(function() {
        let id = this.id;
        $(this).removeAttr("aria-label");
        $(this).next().wrap("<label for='" + id + "'></label>");
        $(this).next().prepend("<span class='sr-only'>Rank of </span>");
        // at least in safari it does a weird thing where it selects 1 for each of them...
        this.value = '';
    });
}

// TODO: Reapply when content changes due to screen size or button press
// TODO: Ensure that this works for small screens (mostly concerned about grid)


// grid functions
function fixGrid() {
    let label = $(this).find("label").first();
    let grid_label_text = label.get(0).innerText; // TODO: Will included required label if present?
    let ng = getVariableAttribute(label.get(0));
    let col_header = $(this).find(".f-grid-col").children();
    let is_radio = !grid_label_text.startsWith("Choose all that apply");
    fixGridLabel(label, ng);
    // wrap each question/row in a fieldset
    if (col_header.length === 0) {
        // have to do low width completely differently, apparently
        addFieldsetsToMobileGrid(
            $(this).find(".f-grid-col").length,
            $(this).children("div").children("div").first(), // should only be one, but just in case
            grid_label_text);
        $(this).find("fieldset").each(function() {
            let row_id = $(this).find(".f-grid-row").children().first().attr("id").split(" ")[0].replace("-label", "");
            // inputs
            $(this).find(".f-grid-row").each(function() {
                // TODO: Trying removing double id first
                $(this).children().first().removeAttr("id");
                let label_text = $(this).children().get(0).innerText;
                let checkbox = $(this).find("mat-checkbox").get(0);
                if (is_radio) modifyGridRadioBtn(checkbox, label_text, ng, row_id);
                else modifyGridCheckbox(checkbox, label_text);
            });
        });
    } else {
        $(this).find(".f-grid-row").each(function() {
            let row_id = $(this).children().first().attr("id").replace("-label", "");
            addFieldsetsToNonMobileGrid(this, grid_label_text);
            // individual checkboxes and radio buttons
            $(this).find("mat-checkbox").each(function(index) {
                let col_label_text = col_header.get(index+1).innerText;
                if (is_radio) modifyGridRadioBtn(this, col_label_text, ng, row_id);
                else modifyGridCheckbox(this, col_label_text);
            });
        });
    }
    // give fieldsets appropriate role
    if (is_radio) $(this).find("fieldset").attr("role", "radiogroup");
    // $(this).find(".f-grid-row").each(function() {
    //     let row_label_text = $(this).children().get(0).innerText;
    //     let row_id = $(this).children().first().attr("id").replace("-label", "");
    //     fieldset
    //     let fieldset = $('<fieldset ' + ng + ' class="row f-grid-row"></fieldset>');
    //     fieldset.append('<legend class="sr-only">' + grid_label_text + ', ' + row_label_text + '</legend>')
    //         .append('<div ' + ng + ' ngclass.lt-md="text-24" aria-hidden="true" class="col text-16 choice-text"><span>' + row_label_text + '</span></div>')
    //         .append($(this).children(":not(:first-child)")); // move over all of the rows
    //     $(this).replaceWith(fieldset);
    //     // radio buttons/checkboxes - using loop because I need the index
    //     let cols = $(fieldset).find("mat-checkbox");
    //     for (let i = 0; i < cols.length; i++) {
    //         let col = cols[i];
    //         let input_label_text = col_header.get(i+1).innerText;
    //         if (grid_label_text.startsWith("Choose all that apply")) {
    //             // multiple answers per row - checkboxes
    //             $(col).removeAttr("aria-labelledby");
    //             let span = createCheckboxSpan($(col).find("input"), $(col).find("svg"), input_label_text);
    //             // a few modifications
    //             span.find(".mat-ripple-element").addClass("mat-checkbox-ripple");
    //             span.find(".mat-checkbox-label").addClass("sr-only");
    //             $(col).children("label").children().remove();
    //             $(col).children("label").append(span.children());
    //         } else {
    //             // radio buttons
    //             let checkbox_input = $(col).find("input").css("display", "none").attr("aria-hidden", "true").attr("aria-label", "ignore this input"); // keep but hide old input
    //             let checkbox_id = checkbox_input.get(0).id;
    //             let radio_button = $('<mat-radio-button ' + ng + ' class="mat-radio-button responsive _mat-animation-noopable mat-accent"></mat-radio-button>')
    //                 .append('<label class="mat-radio-label" for="' + checkbox_id + '-radio"></label>');
    //             let span = createRadioButtonSpan(
    //                 $('<input type="radio" id="' + checkbox_id + '-radio" class="mat-radio-outer-circle" name="' + row_id + '" value="' + input_label_text + '" data-refersto="' + checkbox_id + '" aria-checked="false">'),
    //                 input_label_text);
    //             // a few modifications (and an event handler)
    //             span.find(".mat-ripple-element").addClass("mat-radio-ripple");
    //             span.find(".mat-radio-label-content").addClass("sr-only");
    //             span.find("input").on("change", function() { handleRadioChange(this); });
    //             span.append(checkbox_input);
    //             radio_button.children("label").append(span);
    //             $(col).replaceWith(radio_button);
    //             // TODO: Adjust radio button if checkbox was already checked (on reapply)
    //         }
    //     }
    // });
}
function fixGridLabel(label, ng) {
    // build better label: replace label element with span, remove paragraph element from within span
    label.children().first().replaceWith("<span>" + label.children().get(0).innerText + "</span>"); // would not include required label
    let new_label = $("<span></span>");
    new_label.attr("class", label.attr("class")).attr(ng, "").append(label.children());
    label.replaceWith(new_label);
}
function addFieldsetsToMobileGrid(number, container, grid_label_text) {
    for (let i = 0; i < number; i++) {
        let label_row = container.children("div").first();
        let fieldset = $('<fieldset></fieldset>');
        fieldset.append('<legend class="sr-only">' + grid_label_text + ', ' + label_row.get(0).innerText + '</legend>');
        fieldset.append(label_row.attr("aria-hidden", "true"));
        // now for each of the rows
        while (true) {
            let row = container.children("div").first();
            // if there is nothing in row then we are completely finished - that was the last question
            // if the row has no children than it is the start of the next question, so we are finished with this one
            if (row.length === 0 || row.children().length === 0) break;
            // this is just the reorganization - other stuff can come later
            fieldset.append(row);
        }
        container.append(fieldset);
    }
}
function addFieldsetsToNonMobileGrid(row, grid_label_text) {
    // wrap with fieldset
    $(row).wrap('<fieldset></fieldset>');
    // add row id
    $(row).parent().attr("data-row_id", $(row).children().first().attr("id").replace("-label", ""));
    // hide "label" from AT
    $(row).children().first().attr("aria-hidden", "true");
    // add visually hidden legend
    $(row).parent().prepend('<legend class="sr-only">' + grid_label_text + ', ' + $(row).children().get(0).innerText + '</legend>');
}
function modifyGridCheckbox(checkbox, label_text) {
    $(checkbox).removeAttr("aria-labelledby");
    let span = createCheckboxSpan($(checkbox).find("input"), $(checkbox).find("svg"), label_text);
    // a few modifications
    span.find(".mat-ripple-element").addClass("mat-checkbox-ripple");
    span.find(".mat-checkbox-label").addClass("sr-only");
    $(checkbox).children("label").children().remove();
    $(checkbox).children("label").append(span.children());
}
function modifyGridRadioBtn(checkbox, label_text, ng, row_id) {
    let old_input = $(checkbox).find("input").css("display", "none").attr("aria-hidden", "true").attr("aria-label", "ignore this field"); // keep (but hide) old checkbox input
    let checkbox_id = old_input.get(0).id;
    let radio_button = $('<mat-radio-button ' + ng + ' class="mat-radio-button responsive _mat-animation-noopable mat-accent"></mat-radio-button>')
        .append('<label class="mat-radio-label" for="' + checkbox_id + '-radio"></label>');
    let span = createRadioButtonSpan(
        $('<input type="radio" id="' + checkbox_id + '-radio" class="mat-radio-outer-circle" name="' + row_id + '" value="' + label_text + '" data-refersto="' + checkbox_id + '" aria-checked="false">'),
        label_text);
    // a few modifications (and an event handler)
    span.find(".mat-ripple-element").addClass("mat-radio-ripple");
    span.find(".mat-radio-label-content").addClass("sr-only");
    span.find("input").on("change", function() { handleRadioChange(this); });
    span.append(old_input);
    radio_button.children("label").append(span);
    $(checkbox).replaceWith(radio_button);
    // TODO: Adjust radio button if checkbox was already checked (on reapply)
}


/* -------------------- Date Masking Functions -------------------- */

// parseInt((format/2)) returns 0, 1, or 2, which directly relates to format type
// format%2 returns 0 or 1, which directly relates to / vs -
function getDateValue(input) {
    // switch (parseInt((format/2))) {
    //     case 0:
    //         input = parseMonth(input);
    //         if (input.length > 3) input = input.slice(0, 3) + parseDay(input.slice(3));
    //         if (input.length > 6) input = input.slice(0, 6) + parseYear(input.slice(6));
    //         break;
    //     case 1:
    //         input = parseDay(input);
    //         if (input.length > 3) input = input.slice(0, 3) + parseMonth(input.slice(3));
    //         if (input.length > 6) input = input.slice(0, 6) + parseYear(input.slice(6));
    //         break;
    //     case 2:
    //         input = parseYear(input);
    //         if (input.length > 5) input = input.slice(0, 5) + parseMonth(input.slice(5));
    //         if (input.length > 8) input = input.slice(0, 8) + parseDay(input.slice(8));
    //         break;
    // }
    // // make sure no extra characters
    // input = input.slice(0, 10);
    // // replace separator placeholder
    // if ((format % 2) === 0) input = input.replaceAll("X", "/");
    // else input = input.replaceAll("X", "-");
    // return input;
    
    // month
    input = parseMonth(input);
    if (input.length > 2) {
        // length greater than two means input has (possibly) been added for day
        let new_value = input.slice(0, 2); // save month data
        input = parseDay(input.slice(2)); // parse the rest of the input
        if (input.length) {
            // length greater than zero means input does indeed have something for day
            new_value = new_value + '/' + input.slice(0, 2); // save day data
            input = parseYear(input.slice(2)); // parse the rest of the input
            if (input.length) {
                // length greater than zero means input also has something for year
                new_value = new_value + '/' + input.slice(0, 4);
            }
        }
        return new_value;
    }
    return input;
}
// ensures that the first [lenght] characters of input are numbers (removes other characters)
function parseDateInput(input, length) {
    new_input = ""
    while (input.length) {
        char = input.slice(0, 1);
        if (!isNaN(parseInt(char))) {
            if (new_input.length === length-1) {
                // in other words: If (new_input + char).length === length
                return new_input + input;
            }
            new_input += char;
        }
        input = input.slice(1);
    }
    // if valid numbers in input are fewer than length, we will reach this point and should return what we have
    return new_input;
}
// second params should be 3 and 31 or 1 and 12 (day/month)
function parseTwoDigitInput(input, firstDigitMin, fullMin) {
    input = parseDateInput(input, 2);
    if (!input.length) return '';
    if (parseInt(input.slice(0, 1)) > firstDigitMin || parseInt(input.slice(0, 2)) > fullMin) {
        return '0' + input.slice(0, 1) + input.slice(1);
    }
    // otherwise if input is only length 1, return (still need one more digit)
    // else if (input.length === 1) return input;
    // otherwise insert placeholder separator at appropriate spot and return
    // else return input.slice(0, 2) + 'X' + input.slice(2);
    return input;
}
function parseDay(input) {
    return parseTwoDigitInput(input, 3, 31);
}
function parseMonth(input) {
    return parseTwoDigitInput(input, 1, 12);
}
function parseYear(input) {
    input = parseDateInput(input, 4);
    // allowing any year - no need for extra validation
    if (input.length > 3) return input.slice(0, 4) + 'X' + input.slice(4);
    else return input;
}

// TODO: Move to CSS file, also include needed general CSS modifications

function applyTemporaryCss() {
    // spacing between last radio button or checkbox in group
    $('.f-radio').add('.f-chkbox').each(function() {
        let h = $(this).find('.row').first().css('min-height');
        $(this).find('.row:last-child').css('min-height', h);
    });
    $('a').removeAttr('style');

    $(".flex-grow .row.f-grid-row .col:first-of-type").css("padding-left", "15px").css("padding-right", "15px");
}
