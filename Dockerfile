#################################################################
## Docker Proxy Container
##
##
## @ver 0.2.0
## @author potanin@UD
#################################################################

FROM          dockerfile/nodejs
MAINTAINER    Usability Dynamics, Inc. "http://usabilitydynamics.com"
USER          root

ONBUILD       rm -rf /tmp/**
ONBUILD       rm -rf /var/log/**
ONBUILD       rm -rf /var/cache/**
ONBUILD       rm -rf /var/lib/docker-proxy/**
ONBUILD       rm -rf /var/run/docker-proxy/**

VOLUME        /tmp
VOLUME        /var/log
VOLUME        /var/cache
VOLUME        /etc/docker-proxy

RUN           \
              groupadd --gid 500 docker-proxy && \
              useradd --create-home --shell /bin/bash --groups adm,sudo --uid 500 -g docker-proxy docker-proxy && \
              mkdir /home/docker-proxy/.ssh

RUN           \
              export DEBIAN_FRONTEND=noninteractive && \
              export NODE_ENV=production && \
              apt-get -y update && \
              apt-get -y upgrade && \
              apt-get -y -q install supervisor nano && \
              npm install --silent -g pm2 forever

ADD           bin                                   /usr/local/src/docker-proxy/bin
ADD           lib                                   /usr/local/src/docker-proxy/lib
ADD           static/etc                            /usr/local/src/docker-proxy/static/etc
ADD           static/public                         /usr/local/src/docker-proxy/static/public
ADD           package.json                          /usr/local/src/docker-proxy/package.json
ADD           readme.md                             /usr/local/src/docker-proxy/readme.md

ADD           static/etc/default/docker-proxy.sh    /etc/default/docker-proxy
ADD           static/etc/init.d/docker-proxy.sh     /etc/init.d/docker-proxy
ADD           static/etc/supervisord.conf           /etc/supervisor/supervisord.conf

RUN           \
              export NODE_ENV=production && \
              mkdir -p /etc/docker-proxy && \
              mkdir -p /var/lib/docker-proxy && \
              mkdir -p /var/log/docker-proxy && \
              mkdir -p /var/cache/docker-proxy && \
              mkdir -p /var/run/docker-proxy && \
              mkdir -p /var/run/supervisor && \
              mkdir -p /var/log/supervisor && \
              chgrp docker-proxy /var/lib/docker-proxy && \
              chgrp docker-proxy /var/log/docker-proxy && \
              chgrp docker-proxy /var/run/docker-proxy && \
              chgrp docker-proxy /var/cache/docker-proxy && \
              chgrp docker-proxy /tmp && \
              npm link /usr/local/src/docker-proxy

RUN           \
              npm cache clean && apt-get autoremove && apt-get autoclean && apt-get clean && \
              rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
              chmod +x /etc/init.d/**

EXPOSE        80
EXPOSE        443
EXPOSE        16000

ENV           DOCKER_PROXY_CONFIG_PATH        /usr/local/lib/node_modules/docker-proxy/static/etc/docker-proxy.yaml
ENV           DOCKER_PROXY_SSL_PATH           /usr/local/lib/node_modules/docker-proxy/static/etc/ssl
ENV           DOCKER_PROXY_ADDRESS            0.0.0.0
ENV           DOCKER_PROXY_HOSTNAME           docker-proxy.internal
ENV           DOCKER_PROXY_PORT               8080
ENV           NODE_ENV                        production

WORKDIR       /home/docker-proxy

ENTRYPOINT    [ "/usr/local/bin/docker-proxy.entrypoint" ]
CMD           [ "/bin/bash" ]

