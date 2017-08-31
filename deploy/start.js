#!/usr/bin/env node
'use strict';

var pubjar= require('pubjar')
pubjar({
    gitAddress: 'git@git.chongkouwei.com:wangziqing/DA-parent.git',
    sourcePath: '/Users/wangziqing/onepiecex/eureka-server',
    remotePath: '/root',
    test: [{
        name: 'vertx-web',
        host: '123.123.123.123',
        username: 'root',
        password: '7c3cD505',
        mvn: 'mvn clean install -Pprod -Dmaven.test.skip=true'
    }]
})




