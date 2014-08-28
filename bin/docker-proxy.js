#!/usr/bin/env node
//
// sudo DEBUG=docker:proxy supervisor -w ./ -- ./bin/docker-proxy.js start
// node ./bin/docker-proxy.js start

var dockerProxy = require( '../' );
var commander  = require( 'commander' );

commander._name = 'docker-proxy';

commander.version( require( '../package' ).version )
  .option('-q', 'quiet')

commander.command( 'start' )
  .option('-f', 'foreground')
  .option( '-p, --port [port]', 'Which port use', '9000' )
  .option( '-l, --limit [limit]', 'limit of cputs', process.env.DOCKER_PROXY_WORKER_LIMIT = process.env.DOCKER_PROXY_WORKER_LIMIT || require('os').cpus().length )
  .action( startService );

commander.parse( process.argv );

function startService() {

  // Ignore SIGUSR
  process.on('SIGUSR1', function () {});
  process.on('SIGUSR2', function () {});

  dockerProxy.start( function serviceStarted( error, proxy )  {
    proxy.debug( 'serviceStarted' );

    proxy.listen( 80, '0.0.0.0', function serverReady() {
      console.log( 'serverReady' );
      proxy.log( 'Docker Proxy started on %s:%s.', this.address().address, this.address().port );
    });

  });

}

