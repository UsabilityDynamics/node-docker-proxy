##
#
# $(git branch | sed -n '/\* /s///p')
#
#
# ### Running
# * We volume-mount that docker unix sock file using the DOCKER_SOCK_PATH environment variable, which we set to /var/run/docker.sock by default.
#
##

BUILD_ORGANIZATION	          ?=usabilitydynamics
BUILD_REPOSITORY		          ?=docker-proxy
BUILD_VERSION				          ?=$(shell docker-proxy -V)
BUILD_BRANCH		              ?=$(shell git branch | sed -n '/\* /s///p')
CONTAINER_NAME			          ?=docker-proxy
CONTAINER_HOSTNAME	          ?=docker-proxy.internal
CONTAINER_ENTRYPOINT	        ?=/usr/local/bin/docker-proxy.entrypoint
DOCKER_PROXY_PORT	            ?=80
DOCKER_PROXY_ADDRESS	        ?=0.0.0.0
DOCKER_PROXY_API_PORT	        ?=16000
DOCKER_PROXY_API_ADDRESS	    ?=$(shell hostname -f)

default: image

install:
	@echo "Installing ${BUILD_ORGANIZATION}/${BUILD_REPOSITORY}:${BUILD_VERSION}."
	@npm install

dockerImage:
	@echo "Building ${BUILD_ORGANIZATION}/${BUILD_REPOSITORY}:${BUILD_VERSION}."
	@sudo docker build -t $(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):latest .

restart:
	@sudo docker restart ${CONTAINER_NAME}

stop:
	@sudo docker stop ${CONTAINER_NAME}

start:
	@sudo docker rm -f ${CONTAINER_NAME}
	runContainer

tests:
	@echo "Testing Docker Proxy <${BUILD_BRANCH}> branch."
	@mocha test/unit
	@mocha test/functional
	@mocha test/integration

runContainer:
	@echo "Running ${CONTAINER_NAME}."
	@echo "Checking and dumping previous runtime. $(shell docker rm -f ${CONTAINER_NAME} 2>/dev/null; true)"
	@sudo docker run -itd \
		--name=${CONTAINER_NAME} \
		--hostname=${CONTAINER_HOSTNAME} \
		--entrypoint=${CONTAINER_ENTRYPOINT} \
		--publish=80 \
		--expose=16000 \
		--env=HOME=/home/docker-proxy \
		--env=NODE_ENV=${NODE_ENV} \
		--env=CI=${CI} \
		--env=DOCKER_HOST=${DOCKER_HOST} \
		--env=DOCKER_PROXY_PORT=${DOCKER_PROXY_PORT} \
		--env=DOCKER_PROXY_ADDRESS=${DOCKER_PROXY_ADDRESS} \
		--env=DOCKER_PROXY_API_PORT=${DOCKER_PROXY_API_PORT} \
		--env=DOCKER_PROXY_API_ADDRESS=${DOCKER_PROXY_API_ADDRESS} \
		$(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):latest
	@docker logs ${CONTAINER_NAME}

runTestContainer:
	@echo "Running ${CONTAINER_NAME}."
	@echo "Checking and dumping previous runtime. $(shell docker rm -f ${CONTAINER_NAME} 2>/dev/null; true)"
	@sudo docker run -itd \
		--name=${CONTAINER_NAME} \
		--hostname=${CONTAINER_HOSTNAME} \
		--entrypoint=${CONTAINER_ENTRYPOINT} \
		--publish=80 \
		--expose=16000 \
		--env=HOME=/home/docker-proxy \
		--env=NODE_ENV=${NODE_ENV} \
		--env=CI=${CI} \
		--env=DOCKER_HOST=${DOCKER_HOST} \
		--env=DOCKER_PROXY_PORT=${DOCKER_PROXY_PORT} \
		--env=DOCKER_PROXY_ADDRESS=${DOCKER_PROXY_ADDRESS} \
		--env=DOCKER_PROXY_API_PORT=${DOCKER_PROXY_API_PORT} \
		--env=DOCKER_PROXY_API_ADDRESS=${DOCKER_PROXY_API_ADDRESS} \
		$(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):latest
	@docker logs ${CONTAINER_NAME}

dockerRelease:
	@echo "Releasing ${BUILD_ORGANIZATION}/${BUILD_REPOSITORY}:${BUILD_VERSION}."
	@sudo docker tag $(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):latest $(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):$(BUILD_VERSION)
	@sudo docker push $(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):latest
	@sudo docker push $(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):$(BUILD_VERSION)
	#sudo docker rmi $(BUILD_ORGANIZATION)/$(BUILD_REPOSITORY):$(BUILD_VERSION)
