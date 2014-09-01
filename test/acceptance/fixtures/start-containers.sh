#!/bin/sh
##
##
##

##
## Start Express Server
##
## Argument 1: Name
## Argument 2: Hostname (optional, defaults to name)
##
startExpress () {

  ID=$(docker run -itd \
    --name=$1 \
    --hostname=${2-$1} \
    --publish=80 \
    --workdir=/root/express-server \
    --volume=/var/log/ \
    --env=NODE_ENV=production \
    --env=DOCKER_CONTAINER=true \
    --env=DOCKER_CONTAINER_NAME=${1} \
    --env=DOCKER_CONTAINER_HOSTNAME=${2-$1} \
    --entrypoint=/usr/local/bin/startServer \
    andypotanin/express /bin/bash
  )

  echo "Starting Express Server $1 on ${2-$1}, ID ${ID}.";

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

  echo "Starting HHVM Server $1 on ${2-$1}, ID $ID";

}

# Start Fake Servers
startExpress site1.com
startExpress site2.com
startExpress site3.com *.site3.com

startExpress api.site1.com
startExpress api.site2.com
startExpress api.site3.com *.api.site3.com

startExpress cdn.site1.com
startExpress cdn.site2.com
startExpress cdn.site3.com

startExpress www.site1.com
startExpress www.site2.com
startExpress www.site3.com

# startHHVM site1.com site1.com
# startHHVM site2.com *.site2.com
# startHHVM site3.com *.site3.com
