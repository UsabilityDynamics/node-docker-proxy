##
#
#
##

ORGANIZATION		= usabilitydynamics
NAME						= docker-proxy
VERSION					= 0.1.1

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
		--name=docker-proxy \
		--hostname=docker-proxy \
		--publish=80:80 \
		--publish=443:443 \
		--expose=22 \
		--entrypoint=/usr/local/bin/docker-proxy.entrypoint.sh \
		--volume=/var/log \
		--volume=/var/run \
		--env=HOME=/home/docker-proxy \
		--env=DOCKER_HOSTNAME=172.17.42.1 \
		--env=DOCKER_HOST=2375 \
		$(ORGANIZATION)/$(NAME):$(VERSION) /bin/bash

release:
	docker push $(NAME)
