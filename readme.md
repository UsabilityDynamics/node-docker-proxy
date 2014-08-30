Docker Proxy is a Node.js module that attempts to simplify traffic routing to multiple Docker Containers running on a host.
In most cases Docker Proxy would be bound to port 80/443 on a public IP address and serve as the primary point-of-entry for all web traffic on a host.

***
[![Issues - Bug](https://badge.waffle.io/usabilitydynamics/node-docker-proxy.png?label=bug&title=Bugs)](http://waffle.io/usabilitydynamics/node-docker-proxy)
[![Issues - Backlog](https://badge.waffle.io/usabilitydynamics/node-docker-proxy.png?label=backlog&title=Backlog)](http://waffle.io/usabilitydynamics/node-docker-proxy/)
[![Issues - Active](https://badge.waffle.io/usabilitydynamics/node-docker-proxy.png?label=in progress&title=Active)](http://waffle.io/usabilitydynamics/node-docker-proxy/)
***
[![Dependency Status](https://gemnasium.com/UsabilityDynamics/node-docker-proxy.svg)](https://gemnasium.com/UsabilityDynamics/node-docker-proxy)
[![CodeClimate](http://img.shields.io/codeclimate/github/UsabilityDynamics/node-docker-proxy.svg)](https://codeclimate.com/github/UsabilityDynamics/node-docker-proxy)
[![CodeClimate Coverage](http://img.shields.io/codeclimate/coverage/github/UsabilityDynamics/node-docker-proxy.svg)](https://codeclimate.com/github/UsabilityDynamics/node-docker-proxy)
[![NPM Version](http://img.shields.io/npm/v/object-settings.svg)](https://www.npmjs.org/package/object-settings)
[![CircleCI](https://circleci.com/gh/UsabilityDynamics/node-docker-proxy.png?circle-token=822abc09fd13abaf818fdb0623f3185185599ca5)](https://circleci.com/gh/UsabilityDynamics/node-docker-proxy)
***

### What Docker Proxy Does

* Attempts to connect to a Docker Daemon either via TCP or Unix Socket.
* Automatically creates a Container <-> Hostname (CH) map from running containers and their hostnames.
* If port 80 and 443 are available, will bind and route requests.
* SSL termination if SSL certificates are available and port 443 is available.
* Subscribes to events emitted by the Docker Daemon and the CH map is updated in-real time.
* Spawns a cluster of workers to load balance incoming web traffic. Requests are proxied to corresponding "backend" container.
* If Container hostname includes a wildcard, Docker Proxy will route traffic, verifying that the response from backend is not an error.
* Wildcard routes are "memorized" for quicker routing on future requests.
* Routes are associated with Containers, and if a Container goes offline, a static error/notice template will be displayed.
* Monitors for changes made to the /etc/dproxy.yml configuration, and changes will be applied if configuration file appears to validate.

### API Example

* http://localhost:16000/service/balancer/start
* http://localhost:16000/service/balancer/stop
* http://localhost:16000/service/balancer/resize?size=30

### What Docker Proxy Does Not Do

* In attempts to keep things simple this module avoids some "intelligent" routing logic available in some other Node.js modules. We focus on getting public traffic to a Docker container, your middleware is expected to handle more advanced routing decisions.
* Although Docker Proxy caches known routes, it does no other forms of caching, we'll leave that up to Varnish.

### Assumptions

* If you have multiple Containers that share the same hostname, we assume that requests should be load-balanced.

### Proxy Headers
Docker Proxy attempts to mimic HAProxy when possible and the following request headers are added to requests before being proxied to a backend.

* x-real-ip
* x-forwarded-protocol
* x-forwarded-proto
* x-forwarded-port
* x-forwarded-for
* x-forwarded-host
* x-forwarded-server
* x-debug-backend
* x-debug-time-total
* x-debug-time-backend

### Environment Variables

* DOCKER_PROXY_PORT - If not set, will check PORT, otherwise default to 8080.
* DOCKER_PROXY_HOSTNAME - If not set will check HOST, otherwise default to 0.0.0.0
* DOCKER_PROXY_CONFIG_PATH - Defaults to /etc/docker-proxy/docker-proxy.yaml
* DOCKER_PROXY_WORKER_LIMIT - Will default to number of CPUs.
* DOCKER_PROXY_WORKER_SILENT - Will not include worker log output into master logs.
* DOCKER_PROXY_PID_PATH - Path to PID file.
* DOCKER_PROXY_SSL_PATH - Path to SSL certificate files.
* DOCKER_HOST - TCP address of Docker Daemon.
* DOCKER_SOCK_PATH - Pat to Docker Unix Sock file.

### Directories of Note

* /var/log/docker-proxy/ - Log are stored here.
* /var/lib/docker-proxy/ - Log are stored here.
* /var/run/docker-proxy/ - PIDs and Unix Sock file.

### Terminology

* Container - A running Docker container.
* Backend - A specific port on an active container. Backends are computed based on published ports.
* Route - A {protocol}://{hostname}:{port}/{path} entry to corresponds to Backend(s). Routes are stored in run-time memory.

### Technologies Used

* Waterline ORM is used to store Containers, Routes, etc. in a structure manner. Multiple backends could be used.
* PM2 is used to start/restart/scale workers.
* lru-cache - Caching routes in-memory.
* hipache & http-proxy - Certain routing logic.


### Userful Docker Commands

* docker restart $(docker ps -q)

### Methods

* proxy.listen
* proxy.debug
* proxy.log


### Port Fowarding

On a mac, create a ~/etc/pf.conf with following contents:

    rdr on lo0 proto tcp from any to any port 80 -> 127.0.0.1 port 8080
    rdr on lo0 proto tcp from any to any port 443 -> 127.0.0.1 port 8080

Then run:

    sudo pfctl -ef ~/etc/pf.conf

### Starting Docker Container



