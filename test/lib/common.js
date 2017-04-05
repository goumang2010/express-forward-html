const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
var os = require('os');
exports.getIPlist = function() {
    let IPAddrs = [];
    var ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(function(ifname) {
        var alias = 0;
        ifaces[ifname].forEach(function(iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                IPAddrs.push(iface.address);
            } else {
                // this interface has only one ipv4 adress
                IPAddrs.push(iface.address);
            }
            ++alias;
        });
    });
    return IPAddrs;
}
