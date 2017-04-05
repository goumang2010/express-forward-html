export const isMobile = function() {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch (e) {
        return false;
    }
}();

export const bindEvent = (element, event, cb, capture) => {
    !element.addEventListener && (event = 'on' + event);
    (element.addEventListener || element.attachEvent).call(element, event, cb, capture);
    return cb;
};

export const bindClickEvent = (element, cb, stop, capture) => {
    let eventType = isMobile ? 'touchstart' : 'click';
    if (stop) {
        return bindEvent(element, eventType, function(event) {
            cb.apply(this, arguments);
            if (event.preventDefault) {
                event.preventDefault();
                event.stopPropagation();
            } else {
                event.returnValue = false;
            }
        }, capture);
    } else {
        return bindEvent(element, eventType, cb, capture);
    }
};
