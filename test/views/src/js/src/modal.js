import {
    bindEvent,
    XAjax
} from './utils';
import {
    state,
    __proto__
} from './state.js'

const modalBox = document.querySelector('.modal#dataModal');
const textarea = document.querySelector('.modal#dataModal textarea#jsonData');
const modalTitle = document.querySelector('.modal#dataModal .modal-title');
const nameInput = document.querySelector('.modal#dataModal .form-filename input');
const nameLengthSpan = document.querySelector('.modal#dataModal .form-filename span');
const nameEditBtn = document.querySelector('.modal#dataModal .form-filename .btn');

const modalFooter = document.querySelector('.modal#dataModal .modal-footer');

const applyBtn = document.querySelector('.modal#dataModal #apply');
const cancelBtn = document.querySelector('.modal#dataModal #cancel');
const closeBtn = document.querySelector('.modal#dataModal .close');

state.modal.applyCallback('show', function(val) {
    if (val) {
        modalBox.classList.remove("fade");
        modalBox.style.display = "block";
        if(this.type === 0 && this.title) {
            modalTitle.style.display = "inline-block";
            nameEditBtn.style.display = "inline-block";
            modalFooter.style.display = "block";
            if (this.title) {
                fetchJsonData(state.modal.title);
            }
        } else if (this.type === 1) {
            modalTitle.style.display = "none";
            nameEditBtn.style.display = "none";
            modalFooter.style.display = "none";
        }
    } else {
        modalBox.classList.add("fade");
        modalBox.style.display = "none";
    }
}, 'set');

state.modal.applyCallback('title', function(val) {
    modalTitle.innerText = `修改数据 - ${val}`;
    if(val === '') {;
        filenameState.editting = true;
    }
}, 'set');

state.modal.applyCallback('data', function(val) {
    textarea.value = val;
}, 'set');


export const filenameState = {
    __proto__,
    editting: false,
    length: 0
}

filenameState.applyCallback('length', function(val) {
    nameLengthSpan.innerText = `${val}/20`;
}, 'set');

filenameState.applyCallback('editting', function(val) {
    if (val) {
        nameInput.style.display = "inline-block";
        nameLengthSpan.style.display = "inline-block";
        nameInput.value = state.modal.title;
        filenameState.length = state.modal.title.length;
        // 防止与alert冲突
        setTimeout(() => {nameInput.focus()}, 100);
    } else {
        nameInput.style.display = "none";
        nameLengthSpan.style.display = "none";
    }
}, 'set');



function fetchJsonData(filename) {
    let getJson = new XAjax('/api/task/mock', {
        filename,
        tag: 1
    }, {
        callback(result) {
            state.modal.data = JSON.stringify(result, null, 4);
        }
    });
    getJson.send();
}

function saveJsonData({callback, close} = {callback: null, close: true}) {
    let filename = state.modal.title;

    if (filename === '') {
        alert('文件名不能为空');
        state.modal.title = '';
        return;
    }
    let getJson = new XAjax('/api/task/savemock', {
        filename,
        mockdata: textarea.value
    }, {
        method: 'post',
        callback(result) {
            if (result.code === 200) {
                
                if(close) {
                    state.modal.show = false;
                }
                if (callback) {
                    callback();
                } else {
                    alert('保存成功');
                }
                // location.reload(true);
            } else {
                alert('保存失败');
                console.log(result);
            }
        }
    });
    getJson.send();
}

bindEvent(nameInput, 'blur', (event) => {
    let newname = nameInput.value;
    if (newname === '') {
        alert('必须有文件名');
        return false;
    }
    let oldname;

    if (newname !== (oldname = state.modal.title)) {
        if (oldname) {
            // rename
            let option = {
                callback: (result) => {
                    if (result.code === 200) {
                        state.modal.title = newname;
                        state.mockList[state.mockList.current] = newname;
                        state.mockList.dirty = true;
                        filenameState.editting = false;
                    } else {
                        alert('保存失败');
                        console.log(result);
                    }
                },
                method: 'post'
            };
            let postName = new XAjax('/api/task/renamemock', {
                oldname,
                newname
            }, option);
            postName.send();
        } else {
            // 新建文件
            if (state.mockList.includes(newname)) {
                alert('已存在相同文件名');
            } else {
                state.modal.title = newname;
                saveJsonData({close: false, callback:() => {
                    state.mockList.push(newname);
                    state.mockList.current = state.mockList.length - 1;
                    filenameState.editting = false;
                }});
            }
        }
    }
});

bindEvent(nameInput, 'input', (event) => {
    filenameState.length = nameInput.value.length;
});

bindEvent(nameEditBtn, 'click', (event) => {
    filenameState.editting = true;
});

bindEvent(applyBtn, 'click', (event) => {
    saveJsonData();
});

bindEvent(cancelBtn, 'click', (event) => {
    state.modal.show = false;
});

bindEvent(closeBtn, 'click', (event) => {
    state.modal.show = false;
});
