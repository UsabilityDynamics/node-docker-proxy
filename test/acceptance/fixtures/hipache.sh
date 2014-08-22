#!/bin/sh


#nohup hipache --config  /usr/local/src/vproxy-daemon/hipache.json &

hipache --config  /usr/local/src/vproxy-daemon/hipache.json
redis-cli -a vproxy rpush frontend:localhost http://10.0.0.234:80
redis-cli -a vproxy rpush frontend:usabilitydynamics.com http://10.0.0.234:80
redis-cli -a vproxy rpush frontend:www.usabilitydynamics.com http://10.0.0.234:80


redis-cli -a vproxy lrange frontend:www.usabilitydynamics.com 0 -1

# Remove Keys in 10 seconds (i think)
redis-cli -a vproxy EXPIRE frontend:www.usabilitydynamics.com 10

