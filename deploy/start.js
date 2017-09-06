#!/usr/bin/env node
'use strict';

var pubjar = require('./deploy')
pubjar({
    gitAddress: 'https://github.com/onepiecex/eureka-server.git',
    sourcePath: '/Users/wangziqing/onepiecex',
    remotePath: '/root',
    test: {
        host: '120.76.84.114',
        username: 'root',
        password: '7c3cD505',
        version: '1.0',
        dockerPort : '80:8761',
        mvn: 'mvn clean install -Dmaven.test.skip=true'
    }
})




