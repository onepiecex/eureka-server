from java

volume /tmp

add lib/eureka-server-1.0.jar app.jar
add start.sh start.sh

add http://tengine.taobao.org/download/tengine-2.1.2.tar.gz .

run bash -c 'touch /app.jar'
run bash -c 'touch /start.sh'

expose 8761 8762

entrypoint bash start.sh ${RUNMODE} ${ACTIVE}