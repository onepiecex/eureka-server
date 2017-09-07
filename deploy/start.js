#!/usr/bin/env node
'use strict';

var pubjar = require('./deploy')
pubjar({
    gitAddress: 'https://github.com/onepiecex/eureka-server.git',
    sourcePath: '/Users/wangziqing/onepiecex',
    remotePath: '/root',
    test1: {
        host: '120.76.84.114',
        username: 'root',
        password: '7c3cD505',
        version: '1.0',
        docker_p: "-p 8761:8761",
        mvn: 'mvn clean install -Dmaven.test.skip=true'
    },
    test2: {
        host: '120.76.84.114',
        username: 'root',
        password: '7c3cD505',
        version: '1.0',
        docker_p: "p 8762:8762",
        mvn: 'mvn clean install -Dmaven.test.skip=true'
    }
})




