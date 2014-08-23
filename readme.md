Docker Proxy is a Node.js module that attempts to simplify traffic routing to multiple Docker Containers running on a host.
In most cases Docker Proxy would be bound to port 80/443 on a public IP address and serve as the primary point-of-entry for all web traffic on a host.

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

### What Docker Proxy Does Not Do

* In attempts to keep things simple this module avoids some "intelligent" routing logic available in some other Node.js modules. We focus on getting public traffic to a Docker container, your middleware is expected to handle more advanced routing decisions.
* Although Docker Proxy caches known routes, it does no other forms of caching, we'll leave that up to Varnish.

### Assumptions

* If you have multiple Containers that share the same hostname, we assume that requests should be load-balanced.

### Proxy Headers
Docker Proxy attempts to mimic HAProxy when possible and the following request headers are added to requests before being proxied to a backend.

* x-forwarded-for
* x-forwarded-host
* x-forwarded-server

### Environment Variables

* DOCKER_PROXY_CONFIG_PATH - Defaults to /etc/docker-proxy/docker-proxy.yaml

### Directories of Note

* /var/log/dproxy/ - Log are stored here.
* /var/run/docker-proxy/ - PIDs and Unix Sock file.

### Terminology

* Container - A running Docker container.
* Backend - A specific port on an active container. Backends are computed based on published ports.
* Route - A {protocol}://{hostname}:{port}/{path} entry to corresponds to Backend(s). Routes are stored in run-time memory.

### Technologies Used

* Waterline ORM is used to store Containers, Routes, etc. in a structure manner. Multiple backends could be used.
* PM2 is used to start/restart/scale workers.
