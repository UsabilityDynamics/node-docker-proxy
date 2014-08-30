##
#
#
##

ORGANIZATION		= usabilitydynamics
REPOSITORY		  = docker-proxy
VERSION					= 0.1.2
RUN_NAME			  = docker-proxy.internal
RUN_HOSTNAME	  = docker-proxy.internal
RUN_ENTRYPOINT	= /usr/local/bin/docker-proxy.entrypoint.sh

default: image

image:
	docker build -t $(ORGANIZATION)/$(REPOSITORY):$(VERSION) --rm .

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
		--expose=22 \
		--publish=80:80 \
		--publish=443:443 \
		--entrypoint=${RUN_ENTRYPOINT} \
		--volume=/var/log \
		--volume=/var/run \
		--env=HOME=/home/docker-proxy \
		--env=DOCKER_PROXY_PORT=${DOCKER_PROXY_PORT:-80} \
		--env=DOCKER_PROXY_HOSTNAME=${DOCKER_PROXY_HOSTNAME:-docker-proxy.internal} \
		--env=DOCKER_PROXY_WORKER_LIMIT=${DOCKER_PROXY_WORKER_LIMIT:-8} \
		--env=DOCKER_HOST=${DOCKER_HOST:-172.17.42.1:2375} \
		$(ORGANIZATION)/$(REPOSITORY):$(VERSION) /bin/bash

release:
	docker push $(REPOSITORY)
