#!/usr/bin/env node
'use strict';
require('shelljs/global');
require('colors');
var argv = require('yargs').demand(['module', 'branch']).argv,
    Client = require('ssh2').Client,
    Q = require('q');

Client.prototype.sh = function(sh) {
    var defer = Q.defer();
    this.exec(sh, function(err, stream) {
        if (err) throw err;
        var d;
        stream.on('close', function() {
            defer.resolve(d);
        }).on('data', function(data) {
            d = data.toString();
            console.log('STDOUT: ' + data);
        }).stderr.on('data', function(data) {
            console.log('STDERR: ' + data);
            defer.reject(data.toString());
        });
    });
    console.log(sh.green);
    return defer.promise;
}
Client.prototype.put = function(local, remote) {
    var defer = Q.defer();
    this.sftp(function(err, sftp) {
        if (err) throw err;
        sftp.fastPut(local, remote, function(err, result) {
            if (err) throw err;
            defer.resolve();
        });
    });
    return defer.promise;
}

function getModule(config, module) {
    if (module) {
        var splits = module.split(':');
        if(splits.length!=2){
            console.error('error : --module格式不正确');
            process.exit(-1);
        }
        var mode = splits[0];
        var moduleName = splits[1];
        var modules = config[mode];

        if (modules) {
            for (var m of modules) {
                if (m.name === moduleName) {
                    return m;
                }
            }
        }
    }
}

module.exports = function(config) {
    var module = getModule(config, argv.module);
    if (!module) {
        console.log(`error : module : ${argv.module} 不存在`)
        process.exit(-1);
    }
    var application = config.gitAddress.substring(config.gitAddress.lastIndexOf("/") + 1, config.gitAddress.length - 4);
    cd(`${config.sourcePath}`)
    if (!test('-d', application)) {
        exec(`git clone ${config.gitAddress}`);
    }
    cd(`${application}`);
    console.log('git pull...'.bold);

    exec('git pull');
    exec(`git checkout ${argv.branch}`);
    cd(module.name);
    console.log(`${module.mvn}`.bold);
    exec(`${module.mvn}`);
    console.log('mvn finished'.bold);


    var conn = new Client();
    conn.on('ready', function() {
        var dname = `${module.name}-deploy.tar.gz`;
        var jar, deployPath = `${config.pubPath}/pubjar/deploy/${module.name}`;

        conn.sh(`find ${config.pubPath} -maxdepth 1 -name pubjar -type d -print`)
            .then(function(result) {
                if (!result) {
                    return conn.sh(`mkdir ${config.pubPath}/pubjar`);
                } else {
                    return;
                }
            })
            .then(function(result) {
                return conn.sh(`find ${config.pubPath}/pubjar -maxdepth 1 -name deploy -type d -print`)
            })
            .then(function(result) {
                if (!result) {
                    return conn.sh(`mkdir ${config.pubPath}/pubjar/deploy`);
                } else {
                    return;
                }
            })
            .then(function(result) {
                return conn.sh(`find ${config.pubPath}/pubjar/deploy -maxdepth 1 -name ${module.name} -type d -print`)
            })
            .then(function(result) {
                if (!result) {
                    return conn.sh(`mkdir ${deployPath}`);
                } else {
                    return;
                }
            })
            .then(function(result) {
                console.log(`put ${config.sourcePath}/${application}/${module.name}/target/${dname} to ${deployPath}/${dname}`.bold);
                console.log('......'.bold);
                return conn.put(
                    `${config.sourcePath}/${application}/${module.name}/target/${dname}`,
                    `${deployPath}/${dname}`);
            })
            .then(function(result) {
                console.log('put finished'.green)
                return conn.sh(`tar -xvf ${deployPath}/${dname} -C ${deployPath}`);
            }).then(function(result) {
            return conn.sh(`ls ${deployPath}/lib/*.jar`);
        }).then(function(result) {
            console.log(result)

        })
    }).connect(module);
}