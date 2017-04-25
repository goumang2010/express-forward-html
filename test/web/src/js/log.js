
const logUl = document.querySelector('.logbox ul');
const clearBtn = document.querySelector('.logbox .clear');
export function addLog(v) {
	let node = document.createElement('li');
	node.value = v.text;
	node.innerText = v.text;
	let atag;
	if (v.data) {
		let a = document.createElement('a');
		a.innerText = 'more';
		node.appendChild(a);
		atag = a;
	}
	logUl.appendChild(node);
	return atag;
}