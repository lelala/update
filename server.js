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
        
        var cmd = procstreams('mkdir ' + __dirname + '/__keeplocal', null, { cwd: target.path });
        cmd.data(function (err, stdout, stderr) {
            log += (log == ''?'':'\n') + 'mkdir __keeplocal\n' + stdout;
            //console.log("err:" + err);
            console.log('mkdir __keeplocal');
            console.log("stdout:" + stdout); // prints number of lines in the file lines.txt
            //console.log("stderr:" + stderr);
        })
        
        keeplocal.forEach(function (file, index) {
            cmd = cmd.and('/bin/cp -f ' + file + ' ' + __dirname + '/__keeplocal/' + index, null, { cwd: target.path });
            cmd.data(function (err, stdout, stderr) {
                log += (log == ''?'':'\n') + '/bin/cp -f ' + file + ' ' + __dirname + '/__keeplocal/' + index + '\n' + stdout;
                console.log('/bin/cp -f ' + file + ' ' + __dirname + '/__keeplocal/' + index);
                //console.log("err:" + err);
                console.log("stdout:" + stdout); // prints number of lines in the file lines.txt
            //console.log("stderr:" + stderr);
            })
        });
        
        cmd = cmd.and('git reset --hard HEAD', null, { cwd: target.path });
        cmd.data(function (err, stdout, stderr) {
            log += (log == ''?'':'\n') + 'git reset --hard HEAD\n' + stdout;
            console.log('git reset --hard HEAD');
            //console.log("err:" + err);
            console.log("stdout:" + stdout); // prints number of lines in the file lines.txt
            //console.log("stderr:" + stderr);
        })
        
        cmd = cmd.and('git pull', null, { cwd: target.path });
        cmd.data(function (err, stdout, stderr) {
            log += (log == ''?'':'\n') + 'git pull\n' + stdout;
            console.log('git pull');
            //console.log("err:" + err);
            console.log("stdout:" + stdout); // prints number of lines in the file lines.txt
            //console.log("stderr:" + stderr);
        })
        
        keeplocal.forEach(function (file, index) {
            cmd = cmd.and('/bin/cp -f' + __dirname + '/__keeplocal/' + index + ' ./' + file, null, { cwd: target.path });
            cmd.data(function (err, stdout, stderr) {
                log += (log == ''?'':'\n') + '/bin/cp -f ' + __dirname + '/__keeplocal/' + index + ' ./' + file + '\n' + stdout;
                
                console.log('/bin/cp -f ' + __dirname + '/__keeplocal/' + index + ' ./' + file);
                //console.log("err:" + err);
                console.log("stdout:" + stdout); // prints number of lines in the file lines.txt
            //console.log("stderr:" + stderr);
            });
        });
        
        //cmd = cmd.then('rm -rf ' + __dirname + '/__keeplocal', null, { cwd: target.path });
        //cmd.data(function (err, stdout, stderr) {
        //    log += (log == ''?'':'\n') + 'rm -rf ' + __dirname + '/__keeplocal\n' + stdout;
        //    console.log('rm -rf ' + __dirname + '/__keeplocal');
        //    //console.log("err:" + err);
        //    console.log("stdout:" + stdout); // prints number of lines in the file lines.txt
        //    //console.log("stderr:" + stderr);
        //});
        cmd.on('exit', function () {
            res.end(log);
        });;
    });
});
http.createServer(express).listen(config.port, function () {
    console.log('Express server listening on port ' + config.port);
});
//cd / www / health
//git pull