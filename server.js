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
        var log = 'Update ' + target.name + "[" + new Date().toLocaleString() + "]:";
        var opt = { cwd: target.path };
        log += "\n\toptions:" + JSON.stringify(opt) + "\n";
        var keeplocal = [].concat(target.keeplocal || []);
        
        var cmdstream = null;
        function command(cmd) {
            if (cmdstream == null)
                cmdstream = procstreams(cmd, null, opt);
            else
                cmdstream = cmdstream.and(cmd, null, opt);
            
            cmdstream.data(function (err, stdout, stderr) {
                log += '\n' + cmd;
                if (err)
                    log += "\n!" + JSON.stringify(err) + "\n";
                if (stdout)
                    log += "\n>" + (stdout || "\n");
                if (!stdout && !err) {
                    log += "\n>no result.\n";
                }
                
                console.log(cmd);
                if (err)
                    console.log("!" + err);
                console.log(">" + stdout); // prints number of lines in the file lines.txt
            })
        }
        
        command('rm -rf ' + __dirname + '/__keeplocal');
        command('mkdir ' + __dirname + '/__keeplocal');
        keeplocal.forEach(function (file, index) {
            command('/bin/cp -f ' + file + ' ' + __dirname + '/__keeplocal/l' + index + '.l');
        });
        command('git reset --hard HEAD');
        
        command('git pull');
        keeplocal.forEach(function (file, index) {
            command('mv ' + file + ' ' + __dirname + '/__keeplocal/del' + index + '.l');
            command('mv ' + __dirname + '/__keeplocal/l' + index + '.l ' + file);
        });
        cmdstream.on('exit', function () {
            res.end(log);
            if (target.mail) {
                var nodemailer = require('nodemailer');
                var transporter = nodemailer.createTransport(target.mail.smtpTransportOptions);
                var mailOptions = {
                    from: target.mail.from, // sender address
                    to: target.mail.to, // list of receivers
                    subject: "Update " + target.name+" "+, // Subject line
                    text: log // plaintext body
                };
            }
        });;
    });
});
http.createServer(express).listen(config.port, function () {
    console.log('Express server listening on port ' + config.port);
});
//cd / www / health
//git pull