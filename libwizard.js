function fixAll() {

    // TODO: Set to reapply on buttons - not sure if this is optimal wait time, also doesn't work so well if there are errors preventing proceeding, so will need to deal with that... basically need to be more specific about which buttons...
    $('button').each(function() {
        if (!$(this).hasClass('browse')) $(this).on('click', function() { setTimeout(fixAll, 100); });
    });

    // clear out form-top if it exists, otherwise put the h1 into it
    let top = $('.form-top');
    if (top.length > 0) {
        top.children('libwizard-question').remove();
        top.children('div').remove();
    } else {
        top = $('<div class="form-top"></div>');
        $('form').before(top);
        top.append($('h1'));
    }

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
    let q1 = $('libwizard-question').first();
    if (q1.find('.f-text-block').length > 0) $('.form-top').append(q1);

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
    $(".btn-submit").add(".btn-next").each(fixSubmit);

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

    q.parents('libwizard-question').attr('data-type', 'input');
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

    $(this).parents('libwizard-question').attr('data-type', 'textarea');
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

    $(this).parents('libwizard-question').attr('data-type', 'input');
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

    $(this).parents('libwizard-question').attr('data-type', 'input');
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

    select.parents('libwizard-question').attr('data-type', 'select');
}
// fieldset, parsing error, VoiceOver 'and one more item'
function fixRadioGroup() {
    let fieldset = wrapWithFieldset($(this), $(this).find('label').first());
    fieldset.attr('role', 'radiogroup').addClass('standard');
    
    let group = $(this).find('mat-radio-group');
    let req = false;
    if (group.attr("aria-required") === "true") req = true;
    // remove role, aria-labelledby, and required
    group.removeAttr("role").removeAttr("aria-labelledby").removeAttr("aria-required").removeAttr("required");
    // in case of required, remove special input
    if (req) {
        // add required to fieldset
        fieldset.attr('aria-required', 'true').attr('required', '');
        // remove special input
        $(this).children('.flex-grow').find('input').remove();
        // add listener
        fieldset.on('focusout', function(e) { validateRequiredGroup(this, true, e); });
        // add field for alert
        let alert = $('<div class="invalid-feedback" role="alert" style="display: block;"></div>');
        alert.insertAfter(fieldset.children('legend'));
    }

    // fix inputs
    $(this).find('mat-radio-button label').each(function() {
        let span = createRadioButtonSpan($(this).find('input'), this.innerText);
        $(this).children().remove();
        $(this).append(span);
        $(this).find('input').on('input', function() { handleRadiogroupChange(this); });
    });

    $(this).parents('libwizard-question').attr('data-type', 'group');
}
// replace group, fieldset, parsing error, VoiceOver 'and one more item'
function fixCheckboxGroup() {
    let fieldset = wrapWithFieldset($(this), $(this).find('label').first());
    fieldset.addClass('standard');
    // check if required by searching for special required input
    let req = fieldset.find('input[aria-required=true]').first();
    if (req.length) {
        // remove special input
        req.remove();
        // add required to fieldset
        fieldset.attr('aria-required', 'true').attr('required', '');
        // add listener
        fieldset.on('focusout', function(e) { validateRequiredGroup(this, false, e); });
        // add field for alert
        let alert = $('<div class="invalid-feedback" role="alert" style="display: block;"></div>');
        alert.insertAfter(fieldset.children('legend'));
    }

    // fix inputs
    $(this).find('mat-checkbox label').each(function() {
        let span = createCheckboxSpan($(this).find("input"), $(this).find("svg"), this.innerText);
        $(this).children().remove();
        $(this).append(span.children());
    });

    $(this).parents('libwizard-question').attr('data-type', 'group');
}
// TODO: Remove the comma in the hidden legend? Looks weird for error handling...
// grid - multiple functions so it's easier to understand
function fixGrid() {
    let label = $(this).find("label").first();
    let grid_label_text = label.children().get(0).innerText; // avoid including required label
    let req = $(this).find('input[aria-required=true]').first();
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
            grid_label_text, req);
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
            addFieldsetsToNonMobileGrid(this, grid_label_text, req);
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

    if (req.length) {
        // remove special input
        req.remove();
        let fieldsets = $(this).find('fieldset');
        // give each fieldset required attributes
        fieldsets.attr('aria-required', 'true').attr('required', '');
        // give each fieldset areas for alerts
        let alert = $('<div class="invalid-feedback" role="alert" style="display: block;"></div>');
        alert.insertAfter(fieldsets.children('legend'));
        // give each fieldset a listener
        fieldsets.on('focusout', function(e) { validateRequiredGroup(this, is_radio, e); });
    }

    $(this).parents('libwizard-question').attr('data-type', 'grid');
}
function fixGridLabel(label, ng) {
    // build better label: replace label element with span, remove paragraph element from within span
    label.children().first().replaceWith("<span>" + label.children().get(0).innerText + "</span>"); // would not include required label
    let new_label = $("<span></span>");
    new_label.attr("class", label.attr("class")).attr(ng, "").append(label.children());
    label.replaceWith(new_label);
}
function addFieldsetsToMobileGrid(number, container, grid_label_text, req) {
    for (let i = 0; i < number; i++) {
        let label_row = container.children("div").first();
        let fieldset = $('<fieldset data-type="group"></fieldset>');
        let legend_text = '<span>' + grid_label_text + ', ' + label_row.get(0).innerText + '</span>';
        if (req) legend_text += '<span>, (required)</span>';
        fieldset.append('<legend class="sr-only">' + legend_text + '</legend>');
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
function addFieldsetsToNonMobileGrid(row, grid_label_text, req) {
    // wrap with fieldset
    $(row).wrap('<fieldset data-type="group"></fieldset>');
    // add row id
    $(row).parent().attr("data-row_id", $(row).children().first().attr("id").replace("-label", ""));
    // hide "label" from AT
    $(row).children().first().attr("aria-hidden", "true");
    // add visually hidden legend
    let legend_text = '<span>' + grid_label_text + ', ' + $(row).children().get(0).innerText + '</span>';
    if (req) legend_text += '<span>, (required)</span>';
    $(row).parent().prepend('<legend class="sr-only">' + legend_text + '</legend>');
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
// ranking
function fixRanking() {
    if ($(this).find("select").length === 0) return; // because ranking uses f-rating, so need to differentiate
    let fieldset = wrapWithFieldset($(this), $(this).find('label').first());
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

    // handle required
    let req = $(this).find('input'); // shouldn't normally be any inputs
    if (req.length) {
        // remove special input
        req.remove();
        // give fieldset required attributes
        fieldset.attr('aria-required', 'true').attr('required', '');
        // give fieldset an area for alerts
        let alert = $('<div class="invalid-feedback" role="alert" style="display: block;"></div>');
        alert.insertAfter(fieldset.children('legend'));
        // give fieldset a listener
        fieldset.on('focusout', function(e) { validateRequiredRanking(this, e); });
    }

    $(this).parents('libwizard-question').attr('data-type', 'ranking');
}
// replace input, domain restrictions
function fixEmail() {
    let old_input = $(this).find('input');
    let label = $(this).find('label');
    let placeholder = old_input.attr('placeholder');
    let new_input = replaceInput(old_input, label);
    addDescription(new_input, label, placeholder, true);

    if(new_input.get(0).required) new_input.on('focusout', function() { validateRequired(this); });
    new_input.on('focusout', function() { validateEmail(this); });

    $(this).parents('libwizard-question').attr('data-type', 'input');
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

    q.parents('libwizard-question').attr('data-type', 'input');
}

// hide original button so that a different event can be attached
function fixSubmit() {
    let button = $(this);
    // make a copy
    let new_btn = $(button.get(0).cloneNode(true));
    // add id to the old button and reference to the new one
    button.attr('id', 'submit-btn-id');
    new_btn.attr('data-refersto', 'submit-btn-id');
    // insert the new button and hide the old one
    new_btn.insertBefore(button);
    button.attr('aria-hidden', 'true').css('display', 'none');
    // give the new button the appropriate event
    new_btn.on('click', function() { handleSubmit(this); });
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
function handleFieldsetAlert(fieldset, text, valid) {
    let alert = $(fieldset).find('.invalid-feedback');
    if (!valid && !alert.text().includes(text)) alert.text(text);
    else if (valid && alert.text().includes(text)) alert.text('');
}
function checkForError(question) {
    question = $(question);
    let alert = question.find('.invalid-feedback');
    let label = 'label';
    let q_type = 'input';
    let error = '';
    // replace alert role with none temporarily so we don't spam alerts
    alert.attr('role', 'none');
    switch(question.attr('data-type')) {
        case 'input':
            break;
        case 'textarea':
            q_type = 'textarea';
            break;
        case 'select':
            q_type = 'select';
            break;
        case 'group':
            label = 'legend';
            break;
        case 'ranking':
            label = 'legend';
            q_type = 'select';
            break;
        default:
            return '';
    }
    // grab the label - first shouldn't be necessary but adding that just in case
    label = question.find(label).first();
    // trigger focusout event for error detection
    question.find(q_type).trigger('focusout');
    // make sure there isn't already an "Error" at the start of the label
    label.children('.error-label').remove();
    // check for error
    if (alert.text()) {
        let name = label.children().first().text().replace('\n', ''); // remove required label if it is there
        // indicate problem
        if (alert.text().includes('required')) error = alert.text().replace('This question', name);
        else error = name + ' is invalid. ' + alert.text();
        // modify label/legend
        label.prepend('<span class="error-label">Error: </span>');
        // TODO: Modify legend properly for grid questions (currently only modifying the hidden legend)
    }
    // return to role of alert
    alert.attr('role', 'alert');
    return error;
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
function handleRadiogroupChange(radio) {
    radio = $(radio);
    let parent = radio.parents('fieldset');
    parent.find('input[type=radio]').attr('aria-checked', 'false');
    radio.attr('aria-checked', 'true');
    parent.attr('value', radio.val());
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
function validateRequiredGroup(fieldset, radio, event) {
    if (event && event.originalEvent && fieldset.contains(event.originalEvent.relatedTarget)) {
        // focus has not left the fieldset, so don't need to validate yet
        // TODO: Do remove the alert if the question previously had an error that has now been fixed
        return;
    }
    // TODO: Is it fine to not have the alert attached, since I don't think aria-describedby applies to fieldsets?
    let text = 'This question is required.';
    if (radio) text += ' Please select an option.';
    else text += ' Please select at least one option.';
    handleFieldsetAlert(fieldset, text, $(fieldset).find('input[aria-checked=true]').length);
}
function validateRequiredRanking(fieldset, event) {
    if (event && event.originalEvent && fieldset.contains(event.originalEvent.relatedTarget)) {
        // TODO: Remove alert that has been fixed
        return;
    }
    let text = 'This question is required. Please rank the options.';
    handleFieldsetAlert(fieldset, text, $(fieldset).find('select').get(0).value);
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

function handleSubmit(button) {
    // check each question for issues and compile a list
    let errors = [];
    $('libwizard-question').each(function() {
        // if grid question, need to treat as multiple
        if ($(this).attr('data-type') === 'grid') {
            $(this).find('fieldset').each(function() {
                let error = checkForError(this);
                if (error) errors.push(error);
            });
        } else {
            let error = checkForError(this);
            if (error) errors.push(error);
        }
    });
    // if no issues, pass the click event on to the appropriate button and return
    if (!errors.length) {
        $('#' + button.getAttribute('data-refersto')).click();
        // TODO: Remove the alert if it exists from previous errors and any text that has been pulled out
        return;
    }
    // make an alert that includes the list of issues
    let alert = '<div role="alert" class="error-list f-text-block">';
    alert += '<div>The following errors were found:</div>';
    alert += '<ul>';
    for (let e of errors) {
        alert += '<li>' + e + '</li>';
    }
    alert += '</ul></div>';
    $('.form-top').first().append(alert);
    // move focus and scroll to the first question with errors
    let first = $('.error-label').first().parents('libwizard-question');
    first.attr('tabindex', '-1');
    first.focus();
}

// TODO: Reapply when content changes due to screen size or button press
// TODO: Ensure that this works for small screens (mostly concerned about grid)



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
