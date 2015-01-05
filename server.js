var procstreams = require('procstreams');
var http = require('http');
var express = require('express')();
var config = require('./config.json');

express.get('/', function (req, res) {
    var log = '`';
    var spawn = require('child_process').spawn;
    var cat = spawn('cat', ['server.js'], { cwd: '/www/update' });
    cat.stdout.on('data', function (data) {
        log += (log == '`'?'':'\n') + data;
        console.log(data);
        //if (data == "Password:" && target.git && target.git.password)
        //    git.stdin.write(target.git.password);
        //git.stdin.write('\n>');
    });
    cat.on('exit', function (code) {
        var data = 'cat process exited with code ' + code;
        log += (log == '`'?'':'\n') + data;
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
        //    log += (log == '`'?'':'\n>`') + data;
        //    console.log(data);
        //    if (data == "Password:") {
        //        if (target.git && target.git.password)
        //            process.stdout.write(target.git.password);
        //        process.stdout.write('\n>');
        //    }
        //});
        
        //git.stdout.on('data', function (data) {
        //    log += (log == '`'?'':'\n>`') + data;
        //    console.log(data);
        //});
        //git.on('exit', function (code) {
        //    var data = 'git process exited with code ' + code;
        //    log += (log == '`'?'':'\n>`') + data;
        //    console.log(data);
        //    res.end(log);
        //});
        //return;
        var log = '';
        var keeplocal = [].concat(target.keeplocal || []);
        
        var cmdstream = null;
        function command(cmd, args, options) {
            var opt = options;
            if (cmdstream == null)
                cmdstream = procstreams(cmd, args, options);
            else
                cmdstream = cmdstream.and(cmd, args, options);
            
            cmdstream.data(function (err, stdout, stderr) {
                log += (log == ''?'':'\n') + cmd + '\n';
                if (args)
                    log += "\targs:" + JSON.stringify(args) + "\n";
                if (opt)
                    log += "\toptions:" + JSON.stringify(opt) + "\n";
                if (err)
                    log += "!" + JSON.stringify(err) + "\n";
                if (stdout)
                    log += ">" + (stdout || "\n");
                if (!stdout && !err) {
                    log += ">no result.\n";
                }
                
                console.log(cmd);
                if (err)
                    console.log("!" + err);
                console.log(">" + stdout); // prints number of lines in the file lines.txt
            })
        }
        
        command('rm -rf ' + __dirname + '/__keeplocal', null, { cwd: target.path });
        command('mkdir ' + __dirname + '/__keeplocal', null, { cwd: target.path });
        keeplocal.forEach(function (file, index) {
            command('/bin/cp -f ' + file + ' ' + __dirname + '/__keeplocal/l' + index + '.l', null, { cwd: target.path });
        });
        command('git reset --hard HEAD', null, { cwd: target.path });
        
        command('git pull', null, { cwd: target.path });
        var path = require('path');
        keeplocal.forEach(function (file, index) {
            command('mv ' + file + ' ' + __dirname + '/__keeplocal/l' + (index + keeplocal.length) + '.l', null, { cwd: target.path });
            command('mv ' + __dirname + '/__keeplocal/l' + index + '.l ' + path.join(target.path, file));
        });
        cmdstream.on('exit', function () {
            setTimeout(function () {
                res.end(log);
            }, 200);
        });;
    });
});
http.createServer(express).listen(config.port, function () {
    console.log('Express server listening on port ' + config.port);
});
//cd / www / health
//git pull