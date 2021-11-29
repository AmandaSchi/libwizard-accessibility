
// remove aria-live from questions
$("libwizard-question div").removeAttr("aria-live");

// fix parsing errors
// labels - paragraph inside span
$("span p").each(function() {
    // create new span with the same label text, then remove the original <p> element
    $(this).parent().parent().prepend("<span>" + this.innerText + "</span>");
    $(this).parent().remove();
});
// checkboxes - div inside span
$("span div").each(function() {
    // create new span with the same text, then remove the original <div> element
    $(this).parent().append("<span>" + this.innerText + "</span>");
    $(this).remove();
});
// radio buttons - div inside label
$("label div.mat-radio-container").each(function() {
    // recreate code using spans, preserve the original <input> element to prevent losing essential functionality
    // This solution could easily break if LibWizard code is updated.
    $(this).parent().prepend('<span class="mat-radio-container"><span class="mat-radio-outer-circle"></span><span class="mat-radio-inner-circle"></span></span>');
    let span = $(this).parent().find("span.mat-radio-container");
    span.append($(this).find("input"));
    span.append('<span matripple class="mat-ripple mat-radio-ripple mat-focus-indicator"><span class="mat-ripple-element mat-radio-persistent-ripple"></span></span>');
    // also going ahead and fixing the VoiceOver "and one more item" thing by putting the label text in the same element as the <input> element
    span.append('<span class="mat-radio-label-content radio-label choice-text">' + $(this).parent().get(0).innerText + '</span>');
    $(this).parent().children("div").remove();
});
// temp css to deal with changes caused from fixing radio buttons
$(".mat-radio-label-content").css("padding-left", "28px");
// checkboxes - div inside label
$("mat-checkbox label").each(function() {
    // recreate code using spans, preserve the original <input> and <svg> elements
    // This solution could easily break if LibWizard code is updated.
    $(this).prepend('<span class="mat-checkbox-inner-container"></span');
    let span = $(this).children("span.mat-checkbox-inner-container");
    $(this).append($(this).find("input"));
    span.append('<span matripple class="mat-ripple mat-checkbox-ripple mat-focus-indicator"><span class="mat-ripple-element mat-checkbox-persistent-ripple"></span></span><span class="mat-checkbox-frame"></span><span class="mat-checkbox-background"></span>');
    let bg = span.find(".mat-checkbox-background");
    bg.append($(this).find("svg"));
    bg.append('<span class="mat-checkbox-mixedmark"></span>');
    // also going ahead and fixing the VoiceOver "and one more item" thing by putting the label text in the same element as the <input> element
    let txt = this.innerText;
    $(this).children("div").remove();
    $(this).children("span.mat-checkbox-label").remove();
    $(this).append('<span class="mat-checkbox-label">' + txt + '</span>');
});
// temp css to deal with changes from fixing checkboxes
$(".mat-checkbox-input").css("bottom", "unset").css("left", "unset");

// Put each group of checkboxes inside a fieldset. Add a legend (must be the first element after the fieldset opening tag) and move the label text to the legend.
$(".f-chkbox").each(function() {
    $(this).wrap("<fieldset></fieldset>");
    $(this).parent().prepend("<legend>" + $(this).find("label").get(0).innerHTML + "</legend>");
    $(this).find("label").first().remove();
});
