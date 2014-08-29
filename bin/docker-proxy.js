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
  .option( '-p, --port [port]', 'Which port use', process.env.DOCKER_PROXY_PORT || 8080 )
  .option( '-h, --host [host]', 'Which host use', process.env.DOCKER_PROXY_HOST || '0.0.0.0' )
  .option( '-l, --limit [limit]', 'limit of cputs', process.env.DOCKER_PROXY_WORKER_LIMIT = process.env.DOCKER_PROXY_WORKER_LIMIT || require('os').cpus().length )
  .action( require( '../lib/tasks/start' ) );

commander.command( 'daemon' )
  .option( '-f', 'foreground')
  .option( '-p, --port [port]', 'Which port use', process.env.DOCKER_PROXY_PORT || 8080 )
  .option( '-h, --host [host]', 'Which host use', process.env.DOCKER_PROXY_HOST || '0.0.0.0' )
  .option( '-l, --limit [limit]', 'limit of cputs', process.env.DOCKER_PROXY_WORKER_LIMIT = process.env.DOCKER_PROXY_WORKER_LIMIT || require('os').cpus().length )
  .action( require( '../lib/tasks/daemon' ) );

if( process.argv.length === 2 ) {
  commander.emit( '--help' );
}

commander.parse( process.argv );

