var Hub  = require('cluster-hub');
var cluster = require('cluster');
var http = require('http');
var express = require('express');
var app = express();

var hub = new Hub(cluster);

if (cluster.isMaster) {
  console.log( 'isMaster' );

  // in master process
  hub.on('sum', function (data, sender, callback) {
    callback(null, data.a + data.b);
  });

  // in master process
  hub.on('purge', function (data, sender, callback) {
    console.log( 'master is purigin!' );
    callback(null, data.a + data.b);

    hub.sendToWorkers( 'purge', data );

  });

  cluster.fork();
  cluster.fork();
  cluster.fork();
  cluster.fork();
  cluster.fork();
  cluster.fork();

};

if( cluster.isWorker ) {

  hub.on('purge', function (data, sender, callback) {
    console.log( 'im worker and i was told to purge', process.pid );
  });

  app.use( '/api', function( req, res ) {

    hub.sendToWorkers( 'blah' );

    hub.requestMaster('purge', {a: 1, b:2}, function (err, sum) {
      //process.exit();
    });

    res.send({
      ok: true,
      message: 'done!',
      pid: process.pid
    });

  });

  app.use(function( req, res ) {

    res.send({
      ok: true,
      message: 'blah',
      pid: process.pid
    });


  });

  app.listen(8000);

}
