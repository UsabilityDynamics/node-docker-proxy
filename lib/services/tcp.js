/**
 * TCP Proxy
 *
 */
require( '../docker-proxy' ).service( function serviceHandler( error, service ) {

  service.set({
    name: 'tcp',
    backend: {
      port: 80,
      host: 'localhost'
    },
    frontend: {
      port: 8080,
      host: 'localhost'
    },
    cluster: true
  });

  var through = require('through2')
  var net = require('net')

  var tcpproxy = net.createServer({
    allowHalfOpen:true
  }, function (socket) {

    var serviceSocket = new net.Socket()

    socket.pipe(through(function(chunk,enc,next){
        console.log(chunk.toString())
        this.push(chunk)
        next()
      })).pipe(serviceSocket).pipe(through(function(chunk,enc,next){
        console.log(chunk.toString())
        this.push(chunk)
        next()
      })).pipe(socket)

    serviceSocket.connect( service.get( 'backend.port' ), service.get( 'backend.host' ) )

  })

  tcpproxy.listen( service.get( 'frontend.port' ) )

}, module );
