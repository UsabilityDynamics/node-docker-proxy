#!/bin/sh

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
startHHVM site1.com site1.com
startHHVM site2.com *.site2.com
startHHVM site3.com *.site3.com
