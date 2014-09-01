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
    --env=DOCKER_CONTAINER_NAME=$1 \
    --env=DOCKER_CONTAINER_HOSTNAME=${2-*.$1} \
    --entrypoint=/usr/local/bin/startServer \
    andypotanin/express /bin/bash
  )

  echo "Starting Express Server $1 on ${2-*.$1}, ID $ID";

}

# Start Fake Servers
startExpress site1.com site1.com
startExpress site2.com *.site2.com
startExpress site3.com *.site3.com
startExpress site4.com site4.com
startExpress site5.com site4.com

startExpress cdn.site1.com
startExpress cdn.site2.com
startExpress cdn.site3.com

startExpress www.site1.com
startExpress www.site2.com
startExpress www.site3.com

startExpress api.site1.com
startExpress api.site2.com
startExpress api.site3.com
startExpress api.site4.com
startExpress api.site5.com
startExpress api.site6.com
startExpress api.site7.com
startExpress api.site8.com
startExpress api.site9.com api.site9.com
