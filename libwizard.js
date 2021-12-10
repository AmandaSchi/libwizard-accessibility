function fixAll() {
    // remove aria-live attribute from questions
    $("libwizard-question div").removeAttr("aria-live");

    // turn "label span p" into "label span"
    $("label span p").each(function() {
        $(this).replaceWith(this.innerText);
    });

    // TODO: email question
    $(".f-email").each(function() {
        let input = $(this).find("input");
        let placeholder = input.attr("placeholder");
        if (placeholder) {
            let id = input.attr("id") + "-description";
            input.attr("aria-describedby", id);
            $('<div id="' + id + '">' + placeholder + '</div>').insertAfter($(this).find("label"));
        }
    });

    // TODO: date question (format, range)
    $(".f-date").each(function() {
        let input = $(this).find("input");
        let placeholder = input.attr("placeholder");
        input.attr("data-date_format", getDateFormat(placeholder));
    })
    $(".f-date input").on("input", function(e) {
        let target = e.originalEvent.target;
        target.value = getDateValue(target.value, target.getAttribute('data-date_format'));
    });

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

function getDateFormat(placeholder) {
    switch (placeholder) {
        case 'MM/DD/YYYY': return 0;
        case 'MM-DD-YYYY': return 1;
        case 'DD/MM/YYYY': return 2;
        case 'DD-MM-YYYY': return 3;
        case 'YYYY/MM/DD': return 4;
        case 'YYYY-MM-DD': return 5;
        default: return 0;
    }
}
// parseInt((format/2)) returns 0, 1, or 2, which directly relates to format type
// format%2 returns 0 or 1, which directly relates to / vs -
function getDateValue(input, format) {
    switch (parseInt((format/2))) {
        case 0:
            input = parseMonth(input);
            if (input.length > 3) input = input.slice(0, 3) + parseDay(input.slice(3));
            if (input.length > 6) input = input.slice(0, 6) + parseYear(input.slice(6));
            break;
        case 1:
            input = parseDay(input);
            if (input.length > 3) input = input.slice(0, 3) + parseMonth(input.slice(3));
            if (input.length > 6) input = input.slice(0, 6) + parseYear(input.slice(6));
            break;
        case 2:
            input = parseYear(input);
            if (input.length > 5) input = input.slice(0, 5) + parseMonth(input.slice(5));
            if (input.length > 8) input = input.slice(0, 8) + parseDay(input.slice(8));
            break;
    }
    // make sure no extra characters
    input = input.slice(0, 10);
    // replace separator placeholder
    if ((format % 2) === 0) input = input.replaceAll("X", "/");
    else input = input.replaceAll("X", "-");
    return input;
}
// ensures that the first [lenght] characters of input are numbers (removes other characters)
function parseDateInput(input, length) {
    new_input = ""
    while (input.length) {
        char = input.slice(0, 1);
        if (parseInt(char)) {
            if (new_input.length === length-1) {
                // in other words: If (new_input + char).length ==== length
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
        return '0' + input.slice(0, 1) + 'X' + input.slice(1);
    }
    // otherwise if input is only length 1, return (still need one more digit)
    else if (input.length === 1) return input;
    // otherwise insert placeholder separator at appropriate spot and return
    else return input.slice(0, 2) + 'X' + input.slice(2);
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
