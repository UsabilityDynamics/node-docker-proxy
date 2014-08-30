##
#
#
##

BUILD_ORGANIZATION		= usabilitydynamics
BUILD_REPOSITORY		  = docker-proxy
BUILD_VERSION					= 0.1.2
BUILD_BRANCH		      = $(git branch | sed -n '/\* /s///p')

RUN_NAME			  = docker-proxy.internal
RUN_HOSTNAME	  = docker-proxy.internal
RUN_ENTRYPOINT	= /usr/local/bin/docker-proxy.entrypoint.sh

default: image

image:
	docker build -t $(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):$(BUILD_VERSION) --rm .

restart:
	docker restart docker-proxy

stop:
	docker stop docker-proxy

start:
	docker rm -f docker-proxy
	run

run:
	docker run -itd \
		--name=${RUN_NAME} \
		--hostname={RUN_HOSTNAME} \
		--entrypoint=${RUN_ENTRYPOINT} \
		--expose=22 \
		--publish=80:80 \
		--publish=443:443 \
		--volume=/var/log \
		--volume=/var/run \
		--env=HOME=/home/docker-proxy \
		--env=DOCKER_PROXY_PORT=${DOCKER_PROXY_PORT:-80} \
		--env=DOCKER_PROXY_HOSTNAME=${DOCKER_PROXY_HOSTNAME:-docker-proxy.internal} \
		--env=DOCKER_PROXY_WORKER_LIMIT=${DOCKER_PROXY_WORKER_LIMIT:-8} \
		--env=DOCKER_HOST=${DOCKER_HOST:-172.17.42.1:2375} \
		$(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):$(BUILD_VERSION) /bin/bash

release:
	docker push $(REPOSITORY)
