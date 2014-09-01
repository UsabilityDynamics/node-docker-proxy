##
#
# $(git branch | sed -n '/\* /s///p')
##

BUILD_ORGANIZATION	       	?=usabilitydynamics
BUILD_REPOSITORY		        ?=docker-proxy
BUILD_VERSION				       	?=0.2.0
BUILD_BRANCH		            ?=master

RUN_NAME			              ?=docker-proxy.internal
RUN_HOSTNAME	              ?=docker-proxy.internal
RUN_ENTRYPOINT	            ?=/usr/local/bin/docker-proxy.entrypoint

DOCKER_PROXY_PORT	          ?=80
DOCKER_PROXY_HOSTNAME	      ?=docker-proxy.internal
DOCKER_PROXY_WORKER_LIMIT	  ?=docker-proxy.internal

default: image

image:
	docker build -t $(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):$(BUILD_VERSION) .

restart:
	docker restart docker-proxy

stop:
	docker stop docker-proxy

start:
	docker rm -f docker-proxy
	run

run:
	@echo "Running ${RUN_NAME}."
	@echo "Checking and dumping previous runtime. $(shell docker rm -f ${RUN_NAME} 2>/dev/null; true)"
	@docker run -itd \
		--name=${RUN_NAME} \
		--hostname=${RUN_HOSTNAME} \
		--entrypoint=${RUN_ENTRYPOINT} \
		--publish=80 \
		--publish=443 \
		--expose=22 \
		--volume=/var/log \
		--volume=/var/run \
		--env=HOME=/home/docker-proxy \
		--env=NODE_ENV=staging \
		--env=DOCKER_PROXY_PORT=${DOCKER_PROXY_PORT} \
		--env=DOCKER_PROXY_HOSTNAME=${DOCKER_PROXY_HOSTNAME} \
		--env=DOCKER_PROXY_WORKER_LIMIT=${DOCKER_PROXY_WORKER_LIMIT} \
		--env=DOCKER_HOST=${DOCKER_HOST} \
		$(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):$(BUILD_VERSION)

release:
	docker push $(BUILD_REPOSITORY):$(BUILD_VERSION)
