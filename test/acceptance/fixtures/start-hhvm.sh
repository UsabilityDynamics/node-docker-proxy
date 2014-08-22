#!/bin/sh

##
## curl http://fallujah:16423/v1.7/containers/json
## curl http://fallujah:16423/v1.7/containers/site1.com/json
## curl http://fallujah:16423/v1.7/containers/api.site1.com/json
## curl http://fallujah:16423/v1.7/containers/7344833403aa/json
##

##
## Stop All Containers
##
stopServers () {
  docker rm -f $(docker ps -qa)
}

##
## Start HHVM Server
##
## --hostname=${2-*.$1} \
##
startServer () {

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

  echo "Starting $1 on ${2-*.$1}, ID $ID";

}

# Kill All Servers
stopServers

# Start Fake Servers
startServer site1.com *.site1.com
startServer site2.com *.site2.com
startServer site3.com *.site3.com
startServer site4.com site4.com
startServer site5.com site4.com

startServer api.site1.com
startServer api.site2.com
startServer api.site3.com

startServer cdn.site1.com
startServer cdn.site2.com
startServer cdn.site3.com

startServer temp.site1.com
startServer temp.site2.com
startServer temp.site3.com

