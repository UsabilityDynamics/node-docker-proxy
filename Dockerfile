#################################################################
## Docker Proxy Container
##
## docker build -t usabilitydynamics/docker-proxy --rm .
##
## @ver 0.1.1
## @author potanin@UD
#################################################################

FROM          dockerfile/nodejs
MAINTAINER    Usability Dynamics, Inc. "http://usabilitydynamics.com"
USER          root

VOLUME        /tmp
VOLUME        /var/log
VOLUME        /var/run
VOLUME        /var/lib
VOLUME        /var/cache

ONBUILD       rm -rf /tmp/**
ONBUILD       rm -rf /mnt/**

RUN           \
              groupadd --gid 500 docker-proxy && \
              useradd --create-home --shell /bin/bash --groups adm,sudo --uid 500 -g docker-proxy docker-proxy && \
              mkdir /home/docker-proxy/.ssh

RUN           \
              DEBIAN_FRONTEND=noninteractive && \
              apt-get install --reinstall ca-certificates apt-transport-https && \
              apt-get -y update && apt-get -y upgrade

RUN           \
              DEBIAN_FRONTEND=noninteractive && \
              apt-get -y -q install nano && \
              apt-get -y -q install supervisor

RUN           \
              NODE_ENV=production \
              npm install --silent -g pm2-web grunt-cli mocha should --unsafe-perm

ADD           bin                                   /usr/local/src/docker-proxy/bin
ADD           lib                                   /usr/local/src/docker-proxy/lib
ADD           static                                /usr/local/src/docker-proxy/static
ADD           gruntfile.js                          /usr/local/src/docker-proxy/gruntfile.js
ADD           package.json                          /usr/local/src/docker-proxy/package.json
ADD           readme.md                             /usr/local/src/docker-proxy/readme.md

ADD           static/etc/default/docker-proxy.sh    /etc/default/docker-proxy
ADD           static/etc/init.d/docker-proxy.sh     /etc/init.d/docker-proxy
ADD           static/etc/supervisord.conf           /etc/supervisor/supervisord.conf

RUN           \
              mkdir -p /etc/docker-proxy && \
              mkdir -p /var/lib/docker-proxy && \
              mkdir -p /var/log/docker-proxy && \
              touch /var/run/docker-proxy.pid && \
              NODE_ENV=production \
              npm link /usr/local/src/docker-proxy

RUN           \
              chown docker-proxy /var/run/docker-proxy.pid && \
              chgrp docker-proxy /var/log && \
              chgrp docker-proxy /var/lib && \
              chgrp docker-proxy /var/cache && \
              chgrp docker-proxy /tmp

RUN           \
              npm cache clean && apt-get autoremove && apt-get autoclean && apt-get clean && \
              rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
              chmod +x /etc/init.d/**

EXPOSE        80

ENV           DOCKER_PROXY_CONFIG_PATH        /etc/docker-proxy
ENV           DOCKER_PROXY_HOSTNAME           0.0.0.0
ENV           DOCKER_PROXY_PORT               8080
ENV           NODE_ENV                        production

WORKDIR       /home/docker-proxy

ENTRYPOINT    [ "/usr/local/bin/docker-proxy.entrypoint" ]
CMD           [ "/bin/bash" ]

