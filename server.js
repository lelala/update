var procstreams = require('procstreams');
var http = require('http');
var express = require('express');
var app = express();
var config = require('./config.json');
var path = require('path');
var bodyParser = require('body-parser');



app.use(bodyParser());
// 設定、啟動server
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


app.use(express.static(path.join(__dirname, 'public')));

config.targets.forEach(function (target) {
    var run = function (req, res) {
        var version = req.body.version;
        
        
        var isEMPTY = /^\s*$/i;
        if (isEMPTY.test(version)) {
            res.end("version number is required.");
            return;
        }
        
        var isHEAD = /^\s*head\s*$/i;
        if (target.requireVersion && (isHEAD.test(version))) {
            res.end("version number is required.");
            return;
        }
        
        var log = 'Update ' + target.name + ":";
        var opt = { cwd: target.path };
        log += "\n    at: " + new Date().toLocaleString();
        log += "\n    options: " + JSON.stringify(opt);
        var keeplocal = [].concat(target.keeplocal || []);
        if (keeplocal.length > 0)
            log += "\n    keeplocal: " + JSON.stringify(keeplocal);
        log += "\n";
        
        var cmdstream = null;
        var haserr = false;
        function command(cmd, logresult) {
            if (logresult !== false)
                logresult = true;
            if (cmdstream == null)
                cmdstream = procstreams(cmd, null, opt);
            else
                cmdstream = cmdstream.and(cmd, null, opt);
            
            cmdstream.data(function (err, stdout, stderr) {
                if (logresult) {
                    log += '\n' + cmd;
                    if (err)
                        log += "\n!" + JSON.stringify(err) + "";
                    if (stderr)
                        log += "\n*" + stderr + "";
                    if (stdout)
                        log += "\n>" + (stdout || "");
                    if (!stdout && !err && !stderr) {
                        log += "\n>no result.";
                    }
                    if (!log.match(/\n$/))
                        log += "\n";
                }
                
                console.log(cmd);
                if (err)
                    console.log("!" + JSON.stringify(err));
                if (stderr)
                    console.log("*" + stderr);
                console.log(">" + stdout); // prints number of lines in the file lines.txt
                
                if (err) {
                    haserr = true;
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
                    }, 800);
                }
            })
        }
        command('rm -rf ' + __dirname + '/__keeplocal');
        command('mkdir ' + __dirname + '/__keeplocal');
        keeplocal.forEach(function (file, index) {
            command('/bin/cp -f ' + file + ' ' + __dirname + '/__keeplocal/l' + index + '.l');
        });
        
        command('git fetch');
        
        if (version && version != "HEAD") {
            command('git show ' + version);
            command('git checkout -f ' + version);
        }
        else
            command('git checkout -f');
        
        keeplocal.forEach(function (file, index) {
            command('mv ' + file + ' ' + __dirname + '/__keeplocal/del' + index + '.l');
            command('mv ' + __dirname + '/__keeplocal/l' + index + '.l ' + file);
        });
        
        if (target.writeTag) {
            
            function pad2(n) {  // always returns a string
                return (n < 10 ? '0' : '') + n;
            }
            function pad3(n) {  // always returns a string
                return (n < 10 ? '00' : (n < 100 ? '0' : '')) + n;
            }
            
            var time = new Date();
            var deployT = time.getFullYear() + "." +
                pad2(time.getMonth() + 1) + "." +
                pad2(time.getDate()) + "-" +
                pad2(time.getHours()) + "." +
                pad2(time.getMinutes()) + "." +
                pad2(time.getSeconds()) + "." +
                pad3(time.getMilliseconds());
            var deployM = time.getFullYear() + "/" +
                pad2(time.getMonth() + 1) + "/" +
                pad2(time.getDate()) + " " +
                pad2(time.getHours()) + ":" +
                pad2(time.getMinutes()) + ":" +
                pad2(time.getSeconds());
            command("git tag -a " + deployT + " -m'" + deployM + "'", false);
            command('git push --tags', false);
        }
        cmdstream.on('exit', function () {
            setTimeout(function () {
                if (!haserr) {
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
                            if (target.finalCommand) {
                                console.log('finalCommand: ' + target.finalCommand);
                                command(target.finalCommand, false);
                            }
                        });
                    } else {   
                        if (target.finalCommand) {
                            console.log('finalCommand: ' + target.finalCommand);
                            command(target.finalCommand, false);
                        }
                    }
                }
            }, 1000);
        });
    };
    app.post('/' + target.name, run);
    app.get('/' + target.name, function (req, res) {
        res.render('root', { name: target.name });
    });
});
http.createServer(app).listen(config.port, function () {
    console.log('Express server listening on port ' + config.port);
});
