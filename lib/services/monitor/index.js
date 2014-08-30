/**
 * message.status
 * - die - container stopping, including when manually stopped
 * - stop - container stopped (after die)
 * - start - container starting, and is now running
 * - create - new image ran
 * - start - container started, called after creation as well as directly starting
 * - destroy - When a container (or image) has been removed, the message does not specify which.
 *
 * There are no events for pausing/unpausing.
 *
 */

var path = require('path');
var express = require('express');
var recluster = require('recluster');


if( require( 'cluster' ).isWorker ) {
  console.log( 'Monitor Service - Worker' );

  var app = express();

  app.get('/', function(req, res) {
    res.send('hello from monitor');
  });

  app.listen( 8080, '0.0.0.0', function() {
    console.log( 'Monitor Service listening', this.address() );
  });

}

if( require( 'cluster' ).isMaster ) {
  console.log( 'Monitor Service - Master' );

  var cluster = recluster(path.join(__dirname, 'index.js'), {
    workers: 10,
    readyWhen: 'listening'
  });

  cluster.run();

  process.on('SIGUSR2', function() {
    console.log('Got SIGUSR2, reloading cluster...');
    cluster.reload();
  });

  console.log("spawned cluster, kill -s SIGUSR2", process.pid, "to reload");

}
