#!/usr/bin/env node
//
// sudo DEBUG=docker:proxy supervisor -w ./ -- ./bin/docker-proxy.js start
// node ./bin/docker-proxy.js start

var dockerProxy = require( '../' );
var commander  = require( 'commander' );

commander._name = require( '../package' ).name;

commander
  .version( require( '../package' ).version )
  .option( '-q', 'quiet' )
  .option( '-d, --docker [docker]', 'url or path to docker daemon ', process.env.DOCKER_HOST )

commander.command( 'start' )
  .option( '-f', 'foreground')
  .option( '-p, --port [port]', 'Which port use', process.env.DOCKER_PROXY_PORT || process.env.PORT || 8080 )
  .option( '-h, --host [host]', 'Which host use', process.env.DOCKER_PROXY_HOST || process.env.HOST || '0.0.0.0' )
  .option( '-l, --limit [limit]', 'limit of cputs', 'number' === typeof process.env.DOCKER_PROXY_WORKER_LIMIT ? process.env.DOCKER_PROXY_WORKER_LIMIT : require('os').cpus().length )
  .option( '-s, --silent [silent]', 'silence worker logs', process.env.DOCKER_PROXY_WORKER_SILENT == 'false' ? false : true )
  .option( '--ssl-path', 'Path to SSL certificates.', process.env.DOCKER_PROXY_SSL_PATH ? process.env.DOCKER_PROXY_SSL_PATH : '/etc/ssl' )
  .option( '--pid-path', 'Path to PID file to use.', process.env.DOCKER_PROXY_PID_PATH ? process.env.DOCKER_PROXY_PID_PATH : '/var/run/docker-proxy.pid' )
  .action( require( '../lib/tasks/start' ) );

commander.command( 'daemon' )
  .option( '-f', 'foreground')
  .option( '-p, --port [port]', 'Which port use', process.env.DOCKER_PROXY_PORT || 8080 )
  .option( '-h, --host [host]', 'Which host use', process.env.DOCKER_PROXY_HOST || '0.0.0.0' )
  .option( '-l, --limit [limit]', 'limit of cputs', 'number' === typeof process.env.DOCKER_PROXY_WORKER_LIMIT ? process.env.DOCKER_PROXY_WORKER_LIMIT : require('os').cpus().length )
  .option( '-s, --silent [silent]', 'silence worker logs', 'boolean' === typeof process.env.DOCKER_PROXY_WORKER_SILENT ? process.env.DOCKER_PROXY_WORKER_SILENT : true )
  .option( '--ssl-path', 'Path to SSL certificates.', process.env.DOCKER_PROXY_SSL_PATH ? process.env.DOCKER_PROXY_SSL_PATH : '/etc/ssl' )
  .option( '--pid-path', 'Path to PID file to use.', process.env.DOCKER_PROXY_PID_PATH ? process.env.DOCKER_PROXY_PID_PATH : '/var/run/docker-proxy.pid' )
  .action( require( '../lib/tasks/daemon' ) );

if( process.argv.length === 2 ) {
  commander.emit( '--help' );
}

commander.parse( process.argv );

