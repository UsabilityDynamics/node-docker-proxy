/**
 *
 * Set:
 * export DOCKER_HOST=localhost:16423
 * docker ps
 *
 * @type {exports}
 */
var flocker = require('flocker')
var http = require('http')
var hyperprox = require('hyperprox')

var allServers = [{
  hostname:'fallujah',
  docker:'208.52.164.213:16423'
},{
  hostname:'ramadi',
  docker:'208.52.164.214:16423'
}]

var dockers = flocker()

dockers.on('request', function(req, res){
  console.log(req.method + ' ' + req.url)
})

function getAddress(container){
  var addr = allServers[parseInt(container.replace(/\D/g, ''))-1]

  console.log('-------------------------------------------');
  console.log(container)
  console.log(addr)
  return addr
}

var lastContainer = null

dockers.on('route', function(info, next){
  if(info.container){
    lastContainer = info.name
  }
  next(null, getAddress(lastContainer))
})

dockers.on('list', function(next){
  next(null, allServers)
})

dockers.on('events', function(next){
  next(null, allServers)
})

var server = http.createServer(function(req, res){

  console.log('-------------------------------------------');
  console.dir(req.method + ' ' + req.url)
  console.dir(req.headers)

  res.on('finish', function(){
    console.log('RES: ' + res.statusCode)
    console.dir(res._headers)
  })

  dockers.handle(req, res)
})

server.httpAllowHalfOpen = true

server.listen(16423)
