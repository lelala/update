var procstreams = require('procstreams');
var http = require('http');
var express = require('express')();
var config = require('./config.json');

config.targets.forEach(function (target) {
    var run = function (req, res) {
        var version = req.params.version;
        var log = 'Update ' + target.name + ":";
        var opt = { cwd: target.path };
        log += "\n    at: " + new Date().toLocaleString();
        log += "\n    options: " + JSON.stringify(opt) + "\n";
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
                if (stderr)
                    log += "\n!" + stderr + "\n";
                if (stdout)
                    log += "\n>" + (stdout || "\n");
                if (!stdout && !err && !stderr) {
                    log += "\n>no result.\n";
                }
                
                console.log(cmd);
                if (err)
                    console.log("!" + JSON.stringify(err));
                if (stderr)
                    console.log("!" + stderr);
                console.log(">" + stdout); // prints number of lines in the file lines.txt
                
                if (err || stderr) {
                    setTimeout(function () {
                        res.end(log);
                        if (target.mail) {
                            var nodemailer = require('nodemailer');
                            var transporter = nodemailer.createTransport(target.mail.smtpTransportOptions);
                            var mailOptions = {
                                from: target.mail.from, // sender address
                                to: target.mail.to, // list of receivers
                                subject: target.name + " updated failed!!!" , // Subject line
                                text: log // plaintext body
                            };
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    console.log('Mail error: ' + error);
                                } else {
                                    console.log('Mail sent: ' + info.response);
                                }
                            });
                        }
                    }, 500);
                }
            })
        }
        
        command('git fetch');
        
        if (version) {
            command('git show ' + version);
        }
        
        command('rm -rf ' + __dirname + '/__keeplocal');
        command('mkdir ' + __dirname + '/__keeplocal');
        keeplocal.forEach(function (file, index) {
            command('/bin/cp -f ' + file + ' ' + __dirname + '/__keeplocal/l' + index + '.l');
        });
        //command('git reset --hard HEAD');
        
        if (version) {
            command('git checkout -f ' + version);
        }
        else
            command('git checkout -f');
        
        keeplocal.forEach(function (file, index) {
            command('mv ' + file + ' ' + __dirname + '/__keeplocal/del' + index + '.l');
            command('mv ' + __dirname + '/__keeplocal/l' + index + '.l ' + file);
        });
        
        var depleyTime = (function () {
            function pad2(n) {  // always returns a string
                return (n < 10 ? '0' : '') + n;
            }
            var time = new Date();
            return time.getFullYear() + "."
            pad2(time.getMonth() + 1) + "."
            pad2(time.getDate()) + "."
            pad2(time.getHours()) + "."
            pad2(time.getMinutes()) + "."
            pad2(time.getSeconds());
        })();
        command("git tag -a '" + depleyTime + "'");
        
        command('git push --tags');
        
        cmdstream.on('exit', function () {
            setTimeout(function () {
                res.end(log);
                if (target.mail) {
                    var nodemailer = require('nodemailer');
                    var transporter = nodemailer.createTransport(target.mail.smtpTransportOptions);
                    var mailOptions = {
                        from: target.mail.from, // sender address
                        to: target.mail.to, // list of receivers
                        subject: target.name + " updated." , // Subject line
                        text: log // plaintext body
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log('Mail error: ' + error);
                        } else {
                            console.log('Mail sent: ' + info.response);
                        }
                    });
                }
            }, 500);
        });
    };
    
    express.get('/' + target.name, run);
    express.get('/' + target.name + '/v/:version', run);
});
http.createServer(express).listen(config.port, function () {
    console.log('Express server listening on port ' + config.port);
});
