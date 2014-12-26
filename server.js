var procstreams = require('procstreams');
var http = require('http');
var express = require('express')();
var config = require('./config.json');

config.targets.forEach(function (target) {
    express.get('/' + target.name, function (req, res) {
        var log = '`';
        var spawn = require('child_process').spawn;
        var git = spawn('git', ['pull'], { cwd: target.path });
        git.stdout.on('data', function (data) {
            log += (log == '`'?'':'\n`') + data;
            console.log(data);
            if (data == "Password:" && target.git && target.git.password)
                git.stdin.write(target.git.password);
            git.stdin.write('\n');
        });
        git.on('exit', function (code) {
            var data = 'git process exited with code ' + code;
            log += (log == '`'?'':'\n`') + data;
            console.log(data);
            res.end(log);
        });
        return;
        procstreams('git pull', null, { cwd: target.path })
        .data(function (err, stdout, stderr) {
            console.log(stdout); // prints number of lines in the file lines.txt
            res.end(stdout);
        });
    });
});
http.createServer(express).listen(config.port);
//cd / www / health
//git pull