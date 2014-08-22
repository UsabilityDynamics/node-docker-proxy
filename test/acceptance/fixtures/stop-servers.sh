#!/bin/sh

# Stop Fake Servers
docker rm -f site1.com
docker rm -fsite2.com
docker rm -fsite3.com
docker rm -fsite4.com
docker rm -fsite5.com

docker rm -fcdn.site1.com
docker rm -fcdn.site2.com
docker rm -fcdn.site3.com

docker rm -ftemp.site1.com
docker rm -ftemp.site2.com
docker rm -ftemp.site3.com

docker rm -f api.site1.com
docker rm -f api.site2.com
docker rm -f api.site3.com
docker rm -f api.site4.com
docker rm -f api.site5.com
docker rm -f api.site6.com
docker rm -f api.site7.com

