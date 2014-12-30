var procstreams = require('procstreams');
var http = require('http');
var express = require('express')();
var config = require('./config.json');

express.get('/', function (req, res) {
    var log = '`';
    var spawn = require('child_process').spawn;
    var cat = spawn('cat', ['server.js'], { cwd: '/www/update' });
    cat.stdout.on('data', function (data) {
        log += (log == '`'?'':'\n`') + data;
        console.log(data);
        //if (data == "Password:" && target.git && target.git.password)
        //    git.stdin.write(target.git.password);
        //git.stdin.write('\n');
    });
    cat.on('exit', function (code) {
        var data = 'cat process exited with code ' + code;
        log += (log == '`'?'':'\n`') + data;
        console.log(data);
        res.end(log);
    });
    return;
});

config.targets.forEach(function (target) {
    express.get('/' + target.name, function (req, res) {
        //var log = '`';
        //var spawn = require('child_process').spawn;
        //var git = spawn('git', ['pull'], { cwd: target.path });
        //process.stdin.on('readable', function () {
        //    process.stdin.resume();
        //    var data = process.stdin.read();
        //    log += (log == '`'?'':'\n`') + data;
        //    console.log(data);
        //    if (data == "Password:") {
        //        if (target.git && target.git.password)
        //            process.stdout.write(target.git.password);
        //        process.stdout.write('\n');
        //    }
        //});
        
        //git.stdout.on('data', function (data) {
        //    log += (log == '`'?'':'\n`') + data;
        //    console.log(data);
        //});
        //git.on('exit', function (code) {
        //    var data = 'git process exited with code ' + code;
        //    log += (log == '`'?'':'\n`') + data;
        //    console.log(data);
        //    res.end(log);
        //});
        //return;
        var log = '';
        var keeplocal = [].concat(target.keeplocal || []);
        console.log('mkdir __keeplocal');
        var cmd = procstreams('mkdir __keeplocal', null, { cwd: target.path });
        
        keeplocal.forEach(function (file, index) {
            console.log('/bin/cp ' + file + ' ' + __dirname + '/__keeplocal/' + index);
            cmd = cmd.then('/bin/cp ' + file + ' ' + __dirname + '/__keeplocal/' + index, null, { cwd: target.path });
        });
        
        console.log('git reset --hard HEAD');
        cmd = cmd.then('git reset --hard HEAD', null, { cwd: target.path });
        
        console.log('git pull');
        cmd = cmd.then('git pull', null, { cwd: target.path });
        
        //keeplocal.forEach(function (file, index) {
        //    console.log('/bin/cp --f ' + __dirname + '/__keeplocal/' + index + ' ' + file);
        //    cmd = cmd.then('/bin/cp --f' + __dirname + '/__keeplocal/' + index + ' ' + file, null, { cwd: target.path });//.pipe('');
        //    console.log('/bin/rm --f ' + __dirname + '/__keeplocal/' + index + ' ' + file);
        //    cmd = cmd.then('/bin/rm --f' + __dirname + '/__keeplocal/' + index + ' ' + file, null, { cwd: target.path });
        //});
        
        console.log('rmdir -rf ' + __dirname + '/__keeplocal');
        cmd = cmd.then('rmdir -rf ' + __dirname + '/__keeplocal', null, { cwd: target.path });
        
        cmd.data(function (err, stdout, stderr) {
            log += (log == ''?'':'\n') + stdout;
            console.log(stdout); // prints number of lines in the file lines.txt
        }).on('exit', function () {
            res.end(log);
        });;
    });
});
http.createServer(express).listen(config.port, function () {
    console.log('Express server listening on port ' + config.port);
});
//cd / www / health
//git pull