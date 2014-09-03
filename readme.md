Docker Proxy is a Node.js module that attempts to simplify traffic routing to multiple Docker containers running on a host.

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
The simplification is mostly due to our use of container "hostnames", which we use to determine the requests a particular container may accept.
In most cases Docker Proxy would be bound to port 80/443 on a public IP address and serve as the primary point-of-entry for all web traffic on a host.

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
* If you have multiple Containers that share the same hostname, we assume that requests should be load-balanced.

### Starting Docker Container

```
# Building Docker image from source.
make image
make run
```