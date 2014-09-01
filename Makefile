##
#
# $(git branch | sed -n '/\* /s///p')
#
#
# ### Running
# * We volume-mount that docker unix sock file using the DOCKER_SOCK_PATH environment variable, which we set to /var/run/docker.sock by default.
#
##

BUILD_ORGANIZATION	       	?=usabilitydynamics
BUILD_REPOSITORY		        ?=docker-proxy
BUILD_VERSION				       	?=0.2.0
BUILD_BRANCH		            ?=$(shell git branch | sed -n '/\* /s///p')

RUN_NAME			              ?=docker-proxy.internal
RUN_HOSTNAME	              ?=docker-proxy.internal
RUN_ENTRYPOINT	            ?=/usr/local/bin/docker-proxy.entrypoint

DOCKER_SOCK_PATH	          ?=/var/run/docker.sock
DOCKER_PROXY_PORT	          ?=80
DOCKER_PROXY_HOSTNAME	      ?=$(shell hostname -f)
DOCKER_PROXY_ADDRESS	      ?=0.0.0.0
DOCKER_PROXY_WORKER_LIMIT	  ?=2

default: image

image:
	docker build -t $(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):$(BUILD_VERSION) .

restart:
	@docker restart docker-proxy

stop:
	@docker stop docker-proxy

start:
	@docker rm -f docker-proxy
	run

tests:
	@echo "Testing Docker Proxy <${BUILD_BRANCH}> branch."
	@mocha test/unit
	@mocha test/functional
	@mocha test/integration

run:
	@echo "Running ${RUN_NAME}."
	@echo "Checking and dumping previous runtime. $(shell docker rm -f ${RUN_NAME} 2>/dev/null; true)"
	@docker run -itd \
		--name=${RUN_NAME} \
		--hostname=${RUN_HOSTNAME} \
		--entrypoint=${RUN_ENTRYPOINT} \
		--publish=80 \
		--volume=${DOCKER_SOCK_PATH}:${DOCKER_SOCK_PATH} \
		--env=HOME=/home/docker-proxy \
		--env=NODE_ENV=staging \
		--env=CI=${CI} \
		--env=DOCKER_PROXY_PORT=${DOCKER_PROXY_PORT} \
		--env=DOCKER_PROXY_HOSTNAME=${DOCKER_PROXY_HOSTNAME} \
		--env=DOCKER_PROXY_ADDRESS=${DOCKER_PROXY_ADDRESS} \
		--env=DOCKER_PROXY_WORKER_LIMIT=${DOCKER_PROXY_WORKER_LIMIT} \
		--env=DOCKER_HOST=${DOCKER_HOST} \
		--env=DOCKER_SOCK_PATH=${DOCKER_SOCK_PATH} \
		$(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):$(BUILD_VERSION)

release:
	docker push $(BUILD_REPOSITORY):$(BUILD_VERSION)
