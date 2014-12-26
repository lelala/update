var procstreams = require('procstreams');
var http = require('http');
var express = require('express')();
var config = require('./config.json');

config.targets.forEach(function (target) {
    express.get('/' + target.name, function (req, res) {
        procstreams(('git pull', [], { cwd: target.path })).data(function (err, stdout, stderr) {
            console.log(stdout); // prints number of lines in the file lines.txt
            res.end(stdout);
        });
    });
});
http.createServer(express).listen(config.port);
//cd / www / health
//git pull