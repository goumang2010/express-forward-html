import chaiPromised from 'chai-as-promised';
chai.use(chaiPromised);
import { port } from '../server/config';
import option from '../data/prod.config';
const expect = chai.expect;
const base = `http://localhost:${port}${option.prefix}`;
describe('should inject script correctly', function() {
    let url = `${base}/html?url=${encodeURIComponent('https://www.gome.com.cn/')}`
    let res = fetch(url).then(result => result.text()).then((html) => {
        return html.match(/<script>(\(function inject\([\s\S]+?)<\/script>/)[1];
    });
    it('should find inject script in html', function(done) {
        res.should.be.fulfilled.and.notify(done);
    })
    let insertScript = res.then(s => {
        let snode = document.createElement('script');
        snode.innerHTML = s;
        document.head.appendChild(snode);
    })
    it('script can execute', function(done) {
        insertScript.should.be.fulfilled.and.notify(done);
    })
    it('global var should be set correctly', function(done) {
        setTimeout(function() {
            expect(window.$pageUrl).to.equal('https://www.gome.com.cn/');
            expect(window.$platform).to.equal('PC');
            done();
        }, 100)
    });
    it('xhr ajax can redirect to local', function(done) {
        setTimeout(function() {
            let xhr = new window.XMLHttpRequest();
            let url = `http://localhost:${port}/test/ajax/test1`;
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function(){
                if(xhr.readyState === 4) {
                    expect(xhr.status).to.equal(200);
                    expect(xhr.response).to.equal(JSON.stringify({id: 'test1'}));
                    done();
                }
            }
            xhr.send(null);
        }, 100)
    });
});
