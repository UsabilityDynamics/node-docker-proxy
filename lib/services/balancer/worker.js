var express = require( 'express' );
var cluster = require( 'cluster' );
var app = express();

if( cluster.isMaster )  {
  console.log( 'Load Balancer Master' );
}

if( cluster.isWorker)  {
  console.log( 'Load Balancer Worker' );
}

app.get('/', function(req, res) {
  res.send('hello from LB');
});

app.listen( 8080, '0.0.0.0', function() {
  console.log( 'Load Balancer Service listening', this.address() );
});
