console.log( 'daemon service' );

process.on( 'message', function( data, server ) {

})

var app = require( 'express' ).call()

app.use( '/service/:router/start', function( req, res ) {

  process.send({
    cmd: 'startService',
    service: req.param( 'router' ),
    scale: req.param( 'scale' )
  });

  res.send( 'spawned' );

});

app.use( '/service/:router/stop', function( req, res ) {

  process.send({
    cmd: 'stopService',
    service: req.param( 'router' )
  });

  res.send( 'stopping...' );

});

app.use( '/service/:router/resize', function( req, res ) {

  process.send({
    cmd: 'resizeService',
    service: req.param( 'router' ),
    size: req.param( 'size' ) || 5
  });

  res.send( 'resizing...' );

});

app.use( function( req, res ) {
  res.send({
    message:  'hello from API',
    startBalancer: 'http://localhost:16000/service/balancer/start',
    stopBalancer: 'http://localhost:16000/service/balancer/stop',
    startRouter: 'http://localhost:16000/service/router/stop',
  });
});

app.listen( process.env.DAEMON_PORT || 16000, process.env.DAEMON_HOST || 'localhost', function() {
  console.log( 'Daemon Service listening', this.address() );
});
