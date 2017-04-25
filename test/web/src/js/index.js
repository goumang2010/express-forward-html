import { addLog } from './log';
import { setUrlList, inserUrl, bindAddClick, bindGotoClick } from './urltest';
const socket = io(window.location.host);
Rx.Observable.fromEvent(socket, 'connect').map(x => ({ text: `ready to log from : ${window.location.host} , your socket client id: ${socket.io.engine.id}` })).map((data) => addLog(data)).filter(Boolean).subscribe(x => console.log(x));
Rx.Observable.fromEvent(socket, 'url').mergeMap(url => (inserUrl({ text: url }))).filter(Boolean).subscribe((data) => addLog(data));
Rx.Observable.fromEvent(socket, 'urls').map(x => x.map(url => ({ text: url }))).mergeMap(list => setUrlList(list)).filter(Boolean).subscribe((data) => addLog(data));
bindAddClick().subscribe(x => socket.emit('addurl', x));
bindGotoClick().subscribe((text) => addLog({text}));
