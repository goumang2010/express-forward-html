export const __proto__ = Object.create(null);
__proto__.applyCallback = function applyCallback(key, func, type) {

    const property = Object.getOwnPropertyDescriptor(this, key)
    if (property && property.configurable === false) {
        return;
    }
    
    const getter = property && property.get;
    let _value;
	getter ? (_value = getter.call(this)) : (_value = (property && property.value));

    const setter = property && property.set
    const newProperty = {
        enumerable: true,
        configurable: true,
    };
    if (type === 'get') {
        getter ? (newProperty.get = () => {
            let oldval = getter.call(this);
            let val = func.call(this, _value, oldval)
            if (val != null) {
            	return val;
            } else {
            	return _value;
            }
        }) : (newProperty.get = () => {
        	let val = func.call(this)
            if (val != null) {
            	return val;
            } else {
            	return _value;
            }
        });
        if (!setter) {
        	newProperty.set = (val) => {
        		_value = val;
        	}
        }
    } else if (type === 'set') {
        setter ? (newProperty.set = (val) => {
            setter.call(this, val);
            func.call(this, val);
        }) : (newProperty.set = (val) => {
            let oldval = _value;
            _value = val;
        	func.call(this, val, oldval);
        });
        if (!getter) {
        	newProperty.get = () => {
        		return _value;
        	}
        }
    }
    Object.defineProperty(this, key, newProperty);
}

export const arrayproto = [];
Object.assign(arrayproto, __proto__);

export const state = {
    __proto__,
    // 0 -> mock, 1-> forward
    fetch: 1,
    injected: false,
    socketid: null,
    mockList: {__proto__: arrayproto, length: 0, dirty: false},
    urlList: {__proto__: arrayproto, length: 0},
    logList: {__proto__: arrayproto, length: 0},
    modal: {
        __proto__,
        show: false,
        // 0 -> edit/add mock json ,1 -> view obj
        type: 0,
        title: '',
        data: ''
    }
}
