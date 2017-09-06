#!/bin/bash

# for jdk8: UseCMSCompactAtFullCollection is deprecated
JVM_OPTS="-XX:+CMSScavengeBeforeRemark -XX:+UseConcMarkSweepGC -XX:CMSMaxAbortablePrecleanTime=5000 -XX:+CMSClassUnloadingEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:+UseCMSInitiatingOccupancyOnly"
JVM_OPTS="${JVM_OPTS} -verbose:gc -Xloggc:/gc.log -XX:+PrintGCDetails -XX:+PrintGCDateStamps"
JVM_OPTS="${JVM_OPTS} -Dsun.rmi.dgc.server.gcInterval=3600000 -Dsun.rmi.dgc.client.gcInterval=3600000 -Dsun.rmi.server.exceptionTrace=true"
JVM_OPTS="${JVM_OPTS} -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/java.hprof"
JVM_OPTS="${JVM_OPTS} -XX:+UseCompressedOops"
JVM_OPTS="${JVM_OPTS} -Djava.awt.headless=true"
JVM_OPTS="${JVM_OPTS} -Dsun.net.client.defaultConnectTimeout=10000"
JVM_OPTS="${JVM_OPTS} -Dsun.net.client.defaultReadTimeout=30000"
#JVM_OPTS="${JVM_OPTS} -Dspring.profiles.active=peer1"

JVM_OPTS="${JVM_OPTS} -Dserver.port=8761"


if [ "$1" != "" ]; then
    RUN_MODE=$1
fi

if [ "$RUN_MODE" == "prod" ] ; then
    # jdk8 已经不需要 -XX:PermSize=128m 参数
    JVM_OPTS="${JVM_OPTS} -server -Xms256m -Xmx256m -XX:NewSize=64m"
    JVM_OPTS="${JVM_OPTS} -Dspring.profiles.active=peer1"
elif [ "$RUN_MODE" == "test" ] ; then
    JVM_OPTS="${JVM_OPTS} -server -Xms128m -Xmx128m -XX:NewSize=32m"
    JVM_OPTS="${JVM_OPTS} -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=8563"
    JVM_OPTS="${JVM_OPTS} -Dspring.profiles.active=peer1"
else
    JVM_OPTS="${JVM_OPTS} -server -Xms156m -Xmx156m -XX:NewSize=41m"
 fi


$JAVA_HOME/bin/java ${JVM_OPTS} -jar /app.jar >>/stdout.log 2>>/stderr.log