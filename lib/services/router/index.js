console.log( 'Router service' );
var express = require("express")
var clusterMaster = require("cluster-master")

process.on('message', function(m, server) {
  console.log( require( 'util').inspect( m, { colors: true , depth:5, showHidden: false } ) );
});

var Cluster = require('cluster2');

var app = express();

app.get('/', function(req, res) {
  res.send('hello from LB');
});

var c = new Cluster({
  cluster: true,
  host: 'localhost',
  port: 3000
});

c.on('died', function(pid) {
  console.log('Worker ' + pid + ' died');
});
c.on('forked', function(pid) {
  console.log('Worker ' + pid + ' forked');
});
c.on('SIGKILL', function() {
  console.log('Got SIGKILL');
});
c.on('SIGTERM', function(event) {
  console.log('Got SIGTERM - shutting down');
});
c.on('SIGINT', function() {
  console.log('Got SIGINT');
});

c.listen(function(cb) {
  console.log( 'Daemon Service listening', arguments );
  cb(app);
});