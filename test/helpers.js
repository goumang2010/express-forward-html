
var ejs = require('ejs');
var fs = require('fs');
var path = require('path');

module.exports = function(app) {
	const host = global.$g.hosts && global.$g.hosts[0] || `localhost:${global.$g.port}`;
	app.locals.host = host;
	let apiconfig = require(path.join(__dirname, './data/api.js'));
    app.locals.testInfo = {
        common: {},
        api: apiconfig['real-fetch']
    };

	const urlspath = path.join(__dirname, './data/urls.json');
	const fetchfolder = path.join(__dirname, './data/fetch');
	let rev = Date.now();

	Object.defineProperty(app.locals, 'rev', {
		enumerable: true,
		get() {
			return rev;
		},
		set(val) {
			rev = val;
		}
	});

    app.locals.getMockDataList = function() {
    	return fs.readdirSync(fetchfolder);
    };

    app.locals.getMockData = function(filename) {
    	if (filename) {
            // 因为require会缓存，所以使用fs
            let str = fs.readFileSync(path.join(fetchfolder, filename), 'utf8');
    		return JSON.parse(str);
    	} else {
    		// 取第一个
    		let list = app.locals.getMockDataList();
    		if(list && list[0]) {
                let str = fs.readFileSync(path.join(fetchfolder, list[0]), 'utf8');
    			return JSON.parse(str || '{}');
    		} else {
    			return null;
    		}
    	}
    };

    app.locals.saveMockData = function(filename, mockdata) {
        try {
            fs.writeFileSync(path.join(fetchfolder, filename), mockdata);
            return {code: 200};
        } catch (err) {
            return {code: 500, err};
        }
    };
    app.locals.renameMockData = function(oldname, newname) {
        try {
            fs.renameSync(path.join(fetchfolder, oldname), path.join(fetchfolder, newname));
            return {code: 200};
        } catch (err) {
            return {code: 500, err};
        }
    };    

    app.locals.getTestUrls = function(){
    	let list = require(urlspath);
    	if (Array.isArray(list)) {
    		list = list.map((x) => ({
    			href: `http://${host}/api/page/html?pageUrl=${encodeURIComponent(x)}`,
    			text: x
    		}));
    	}
    	return list;
    };

    app.locals.pushTestUrl = function(url){
    	let list = require(urlspath);
    	if (Array.isArray(list)) {
    		if(!list.includes(url)) {
	    		list.push(decodeURIComponent(url));
	    		fs.writeFileSync(urlspath, JSON.stringify(list, null, 4));
    		}
    		return true;
    	}
    	return false;
    };

    app.locals.getDefaultApi = function(type){
    	return apiconfig[type];
    };

};    
