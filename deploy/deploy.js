#!/usr/bin/env node
'use strict';
require('shelljs/global');
require('colors');
var argv = require('yargs').demand(['runmode','branch']).argv,
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

function getConfig(config, runmode,module) {
    if (module) {
        var modules = config[runmode];
        if (modules) {
            for (var m of modules) {
                if (m.name === module) {
                    return m;
                }
            }
        }
    }else{
        return config[runmode];
    }
}

module.exports = function(config) {
    var cg = getConfig(config,argv.runmode, argv.module);

    var application = config.gitAddress.substring(config.gitAddress.lastIndexOf("/") + 1, config.gitAddress.length - 4);

    var sourcePath = config.sourcePath;

    cd(`${sourcePath}`)
    if (!test('-d', application)) {
        exec(`git clone ${config.gitAddress}`);
    }
    cd(`${application}`);

    sourcePath += "/" + application;

    console.log('git pull...'.bold);

    exec('git pull');
    exec(`git checkout ${argv.branch}`);

    console.log(`${cg.mvn}`.bold);
    exec(`${cg.mvn}`);
    console.log('mvn finished'.bold);

    var appName = argv.module? argv.module : application;

    var conn = new Client();
    conn.on('ready', function() {
        var dname = `${appName}-deploy.tar.gz`;
        var jar, deployPath = `${config.remotePath}/pubjar/deploy/eureka-server`;

        conn.sh(`find ${config.remotePath} -maxdepth 1 -name pubjar -type d -print`)
            .then(function(result) {
                if (!result) {
                    return conn.sh(`mkdir ${config.remotePath}/pubjar`);
                } else {
                    return;
                }
            })
            .then(function(result) {
                return conn.sh(`find ${config.remotePath}/pubjar -maxdepth 1 -name deploy -type d -print`)
            })
            .then(function(result) {
                if (!result) {
                    return conn.sh(`mkdir ${config.remotePath}/pubjar/deploy`);
                } else {
                    return;
                }
            })
            .then(function(result) {
                return conn.sh(`find ${config.remotePath}/pubjar/deploy -maxdepth 1 -name eureka-server -type d -print`)
            })
            .then(function(result) {
                if (!result) {
                    return conn.sh(`mkdir ${deployPath}`);
                } else {
                    return;
                }
            })
            .then(function(result) {
                console.log(`put ${sourcePath}/target/${dname} to ${deployPath}/${dname}`.bold);
                console.log('......'.bold);
                return conn.put(
                    `${sourcePath}/target/${dname}`,
                    `${deployPath}/${dname}`);
            })
            .then(function(result) {
                console.log('put finished'.green)
                return conn.sh(`tar -xvf ${deployPath}/${dname} -C ${deployPath}`);
            }).then(function(result) {
            return conn.sh(`ls ${deployPath}/lib/*.jar`);
        }).then(function(result) {
            return conn.sh(`docker ps|grep ${appName}:${cg.version} |awk '{print $1}'`);
        }).then(function(result) {
            if(!result){
                return;
            }
           return conn.sh(`docker kill ${result}`)
        }).then(function(result) {
            return conn.sh(`docker build -t ${appName}:${cg.version} ${deployPath}`);
        }).then(function(result) {
            return conn.sh(`docker run -d -p ${cg.dockerPort} ${appName}:${cg.version}`);
        }).then(function(result) {
            console.log('deploy success!!'.bold)
            process.exit(-1);
        })
    }).connect(cg);
}