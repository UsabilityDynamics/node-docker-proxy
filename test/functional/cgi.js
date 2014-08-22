/**
 *
 * forever start -w cgi.js
 * forever logs cgi.js
 *
 *
 * apt-get install spawn-fcgi
 *
 *
 * fastcgi --port=9000 --socket=/var/run/hhvm.sock
 *
 *
 * nohup rm -rf /var/run/hhvm.sock && hhvm --mode daemon &
 * nohup rm -rf /var/run/hhvm.sock && hhvm --mode daemon -vServer.Type=fastcgi -vServer.FileSocket=/var/run/hhvm.sock &
 *
 * @type {exports}
 */
var phpServer = require( 'serve-php' );
var app = require( 'express').call();
var cgi = require("fastcgi-parser");

var fastcgi = require( 'serve-php/lib/fastcgi' )({
  fastcgiHost: '10.0.0.232',
  fastcgiPort: 9000,
  root: '/var/www'
});

app.get('/_status', function( req, res, next ) {
  res.send( 200, 'server up 55' );
});

// PHP Routes
app.use( function( req, res, next ) {
  var url     = require('url');

  //var script_file = url.parse(req.url).pathname;

  console.log( 'script_file', script_file );

  next();

} );

app.use( fastcgi );

// 404
app.get( '/', function( req, res ) {
  res.send( 404, 'nothing found.' );
});

app.listen( 8010 || null, 'localhost', function() {
  console.log("Express server listening on port %d in %s host", this.address().port, this.address().address);
});