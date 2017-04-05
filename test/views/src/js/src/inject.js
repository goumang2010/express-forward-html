import {
    bindEvent,
    XAjax
} from './utils';
import {
    state
} from './state.js';


const editMockBtn = document.getElementById('editDataBtn');
const addMockBtn = document.getElementById('addDataBtn');
const delMockBtn = document.getElementById('delDataBtn');

const injectBtn = document.getElementById('injectBtn');
const dataSelect = document.getElementById('dataSelect');

let datalist = document.querySelectorAll('#dataSelect option');

state.mockList.push(...Array.prototype.map.call(datalist, x => x.innerText));
state.mockList.current = 0;

const projectInput = document.getElementById('project');
const fetchInput = document.getElementById('fetchurl');
const mockFetch = document.getElementById('mockfetch');
const reportInput = document.getElementById('reporturl');
const mockReport = document.getElementById('mockreport');


state.applyCallback('fetch', function(isforward) {
    if (isforward) {
        dataSelect.setAttribute('disabled', true);
        editMockBtn.setAttribute('disabled', true);
        addMockBtn.setAttribute('disabled', true);
        delMockBtn.setAttribute('disabled', true);
    } else {
        dataSelect.removeAttribute('disabled');
        editMockBtn.removeAttribute('disabled');
        addMockBtn.removeAttribute('disabled');
        delMockBtn.removeAttribute('disabled');
    }
}, 'set');
state.fetch = 1;

state.mockList.applyCallback('length', function(val) {
    this.dirty = true;
}, 'set');

state.mockList.applyCallback('dirty', function(val) {
    if(val) {
        setTimeout(() => {
            // render options
            dataSelect.innerHTML = ''; 
            for(let v of this) {
                if (v) {
                    let node = document.createElement('option');
                    node.value = v;
                    node.innerText = v;
                    dataSelect.appendChild(node);
                }
            }
            this.dirty = false;
            dataSelect.selectedIndex = state.mockList.current || 0;
        }, 10);
    }
}, 'set');

export function exeInject(notify = true) {
    let data = {
        project: projectInput.value,
        orginApi: JSON.stringify({
            fetch: fetchInput.value,
            report: reportInput.value
        }),
        mockApi: JSON.stringify({
            fetch: mockFetch.value,
            report: mockReport.value
        }),
        socketid: state.socketid
    };
    let getJson = new XAjax('/api/inject', data, {
        method: 'post',
        callback(result) {
            if (result.code === 200) {
                state.injected = true;
                notify && alert('注入成功');
            } else {
                alert('注入失败，请查看控制台打印的结果');
            }

            console.log(result);
        }
    });
    getJson.send();
}

function setMock(filename) {
    let getJson = new XAjax('/api/task/setmock', {
        filename
    }, {
        callback(result) {
            if (result.code !== 200) {
                alert('mock数据设置失败，请查看控制台打印的结果');
                console.log(result);
            }
        }
    });
    getJson.send();
}

bindEvent(editMockBtn, 'click', (event) => {
    state.modal.type = 0;
    state.modal.title = dataSelect.value;
    state.modal.show = true;
});

bindEvent(addMockBtn, 'click', (event) => {
    state.modal.type = 0;
    state.modal.show = true;
    state.modal.title = '';
    // state.mockList.current = state.mockList.length;
    // state.mockList.push('');
});

bindEvent(injectBtn, 'click', (event) => {
    exeInject();
    if (dataSelect.getAttribute('disabled') == null) {
        setMock(dataSelect.value);
    }
    if (event.preventDefault) {
        event.preventDefault();
        event.stopPropagation();
    } else {
        event.returnValue = false;
    }
});


bindEvent(dataSelect, 'change', (event) => {
    state.mockList.current = dataSelect.selectedIndex;
});

bindEvent(mockFetch, 'change', (event) => {
    state.fetch = (mockFetch.value.includes('forward') ? 1 : 0);
});
