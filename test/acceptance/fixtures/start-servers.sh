#!/bin/sh

##
## curl http://fallujah:2375/v1.7/containers/json
## curl http://fallujah:2375/v1.7/containers/site1.com/json
## curl http://fallujah:2375/v1.7/containers/site2.com/json
## curl http://fallujah:2375/v1.7/containers/site3.com/json
## curl http://fallujah:2375/v1.7/containers/updates.site1.com/json
## curl http://fallujah:2375/v1.7/containers/api.site1.com/json
## curl http://fallujah:2375/v1.7/containers/7344833403aa/json
##

##
## Stop All Containers
##
stopServers () {
  docker rm -f $(docker ps -qa)
}

##
## Start Express Server
##
startExpress () {

  ID=$(docker run -itd \
    --name=$1 \
    --hostname=${2-$1} \
    --publish=80 \
    --publish=8080 \
    --expose=11000 \
    --workdir=/root/express-server \
    --volume=/var/log/ \
    --env=NODE_ENV=production \
    --entrypoint=/usr/local/bin/startServer \
    andypotanin/express /bin/bash
  )

  echo "Starting Express Server $1 on ${2-*.$1}, ID $ID";

}

##
## Start HHVM Server
##
## --hostname=${2-*.$1} \
##
startHHVM () {

  ID=$(docker run -itd \
    --name=$1 \
    --hostname=${2-$1} \
    --publish=80 \
    --entrypoint=/etc/entrypoints/hhvm \
    --volume=/home/core/entrypoints:/etc/entrypoints \
    --volume=/home/core/tmp/www:/var/www \
    --volume=/var/log/ \
    --env=APACHE_LOG_DIR=/var/log/apache2 \
    --env=APACHE_RUN_USER=docker \
    --env=APACHE_RUN_GROUP=docker \
    --env=RUN_AS_USER=docker \
    --env=RUN_AS_GROUP=docker \
    --env=PHP_ENV=production \
    andypotanin/hhvm /bin/bash
  )

  echo "Starting HHVM Server $1 on ${2-*.$1}, ID $ID";

}

# Kill All Servers
stopServers

# Start Fake Servers
startHHVM site1.com *.site1.com
startHHVM site2.com *.site2.com
startHHVM site3.com *.site3.com
startHHVM site4.com site4.com
startHHVM site5.com site4.com

startHHVM updates.site1.com updates.site1.com

startHHVM cdn.site1.com
startHHVM cdn.site2.com
startHHVM cdn.site3.com

startExpress api.site1.com
startExpress api.site2.com
startExpress api.site3.com
startExpress api.site4.com
startExpress api.site5.com
startExpress api.site6.com
startExpress api.site7.com
startExpress api.site8.com
startExpress api.site9.com api.site9.com

