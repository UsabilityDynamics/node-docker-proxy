#!/bin/sh
### BEGIN INIT INFO
# Provides:          docker-proxy
# Required-Start:    $local_fs $network $remote_fs $syslog
# Required-Stop:     $local_fs $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: fast and reliable load balancing reverse proxy
# Description:       This file should be used to start and stop docker-proxy.
### END INIT INFO

# Author: Arnaud Cornet <acornet@debian.org>

PATH=/sbin:/usr/sbin:/bin:/usr/bin
PIDFILE=/var/run/docker-proxy/docker-proxy.pid
CONFIG=/etc/docker-proxy/docker-proxy.yaml
DOCKERPROXY=/usr/local/bin/docker-proxy
RUNDIR=/var/run/docker-proxy
EXTRAOPTS=

test -x DOCKERPROXY || exit 0

if [ -e /etc/default/docker-proxy ]; then
	. /etc/default/docker-proxy
fi

test -f "$CONFIG" || exit 0

[ -f /etc/default/rcS ] && . /etc/default/rcS
. /lib/lsb/init-functions


check_docker-proxy_config()
{
	DOCKERPROXY -c -f "$CONFIG" >/dev/null
	if [ $? -eq 1 ]; then
		log_end_msg 1
		exit 1
	fi
}

docker-proxy_start()
{
	[ -d "$RUNDIR" ] || mkdir "$RUNDIR"
	chown docker-proxy:docker-proxy "$RUNDIR"
	chmod 2775 "$RUNDIR"

	check_docker-proxy_config

	start-stop-daemon --quiet --oknodo --start --pidfile "$PIDFILE" \
		--exec DOCKERPROXY -- -f "$CONFIG" -D -p "$PIDFILE" $EXTRAOPTS || return 2
	return 0
}

docker-proxy_stop()
{
	if [ ! -f $PIDFILE ] ; then
		# This is a success according to LSB
		return 0
	fi
	for pid in $(cat $PIDFILE) ; do
		/bin/kill $pid || return 4
	done
	rm -f $PIDFILE
	return 0
}

docker-proxy_reload()
{
	check_docker-proxy_config

	DOCKERPROXY -f "$CONFIG" -p $PIDFILE -D $EXTRAOPTS -sf $(cat $PIDFILE) \
		|| return 2
	return 0
}

docker-proxy_status()
{
	if [ ! -f $PIDFILE ] ; then
		# program not running
		return 3
	fi

	for pid in $(cat $PIDFILE) ; do
		if ! ps --no-headers p "$pid" | grep docker-proxy > /dev/null ; then
			# program running, bogus pidfile
			return 1
		fi
	done

	return 0
}


case "$1" in
start)
	log_daemon_msg "Starting docker-proxy" "docker-proxy"
	docker-proxy_start
	ret=$?
	case "$ret" in
	0)
		log_end_msg 0
		;;
	1)
		log_end_msg 1
		echo "pid file '$PIDFILE' found, docker-proxy not started."
		;;
	2)
		log_end_msg 1
		;;
	esac
	exit $ret
	;;
stop)
	log_daemon_msg "Stopping docker-proxy" "docker-proxy"
	docker-proxy_stop
	ret=$?
	case "$ret" in
	0|1)
		log_end_msg 0
		;;
	2)
		log_end_msg 1
		;;
	esac
	exit $ret
	;;
reload|force-reload)
	log_daemon_msg "Reloading docker-proxy" "docker-proxy"
	docker-proxy_reload
	ret=$?
	case "$ret" in
	0|1)
		log_end_msg 0
		;;
	2)
		log_end_msg 1
		;;
	esac
	exit $ret
	;;
restart)
	log_daemon_msg "Restarting docker-proxy" "docker-proxy"
	docker-proxy_stop
	docker-proxy_start
	ret=$?
	case "$ret" in
	0)
		log_end_msg 0
		;;
	1)
		log_end_msg 1
		;;
	2)
		log_end_msg 1
		;;
	esac
	exit $ret
	;;
status)
	docker-proxy_status
	ret=$?
	case "$ret" in
	0)
		echo "docker-proxy is running."
		;;
	1)
		echo "docker-proxy dead, but $PIDFILE exists."
		;;
	*)
		echo "docker-proxy not running."
		;;
	esac
	exit $ret
	;;
*)
	echo "Usage: /etc/init.d/docker-proxy {start|stop|reload|restart|status}"
	exit 2
	;;
esac

: