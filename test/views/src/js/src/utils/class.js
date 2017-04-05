function trimCls(c) {
    return (typeof (c) === 'string' ? c.trim().replace(/\s+/g, ' ').split(' ') : c);
}

function CtrlClass(ele) {
    if (!ele) throw new Error('ctrlClass传入元素为空');
    this.ele = ele;
    this.classList = ele.classList;
}

CtrlClass.prototype.show = function() {
    this.ele.style.display = 'block';
};

CtrlClass.prototype.hide = function() {
    this.ele.style.display = 'none';
};

CtrlClass.prototype.hasClass = function(c) {
    return trimCls(c).every((v) => {
        return !!this.classList.contains(v);
    });
};

CtrlClass.prototype.addClass = function(c) {
    trimCls(c).forEach((v) => {
        if (!this.hasClass(v)) {
            this.classList.add(v);
        }
    });
};

CtrlClass.prototype.removeClass = function(c) {
    trimCls(c).forEach((v) => {
        this.classList.remove(v);
    });
};

CtrlClass.prototype.toggleClass = function(c) {
    trimCls(c).forEach((v) => {
        this.classList.toggle(v);
    });
};

export default CtrlClass;
