##
#
#
##

ORGANIZATION		= usabilitydynamics
NAME						= docker-proxy
VERSION					= 0.1.2

default: image

image:
	docker build -t $(ORGANIZATION)/$(NAME):$(VERSION) --rm .

restart:
	docker restart docker-proxy

stop:
	docker stop docker-proxy

start:
	docker rm -f docker-proxy

run:
	docker run -itd \
		--name=docker-proxy.internal \
		--hostname=docker-proxy.internal \
		--expose=22 \
		--publish=80:80 \
		--publish=443:443 \
		--entrypoint=/usr/local/bin/docker-proxy.entrypoint.sh \
		--volume=/var/log \
		--volume=/var/run \
		--env=HOME=/home/docker-proxy \
		--env=DOCKER_PROXY_PORT=80 \
		--env=DOCKER_PROXY_HOSTNAME=docker-proxy.internal \
		--env=DOCKER_PROXY_WORKER_LIMIT=8 \
		--env=DOCKER_HOST=172.17.42.1:2375 \
		$(ORGANIZATION)/$(NAME):$(VERSION) /bin/bash

release:
	docker push $(NAME)
