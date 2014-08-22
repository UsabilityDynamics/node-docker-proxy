/**
 * Veneer Router
 *
 *  supervisor --no-restart-on exit --watch bin,lib --quiet --harmony -- /usr/local/src/docker-proxy-daemon/lib/services/router
 *  forever start /usr/local/src/docker-proxy-daemon/lib/services/router/router.js
 *
 *  supervisor --no-restart-on exit --watch bin,lib --quiet --harmony -- lib/services/router
 *
 *  pm2 start lib/services/router/router.js -i 2 --name "router" --watch
 *  node lib/services/router/router.js
 *
 * Error: socket hang up
 * Error: connect ECONNREFUSED
 *
 * @version 0.1.1
 * @author potanin@UD
 * @constructor
 * @type {*}
 */

var _ = require('lodash');
var utility = require('../../common/utility');
var path = require('path');
var watchr = require('watchr');
var extend = require('deep-extend');
var yaml = require('yaml-js');
var colors = require('colors');
var request = require('request');
var fs = require('fs');
var proxy = require( 'http-proxy').createProxyServer();

utility.findById( {}, '234234', function() {

});

startService();

function SecureMiddleware( req, res ) {

  req.headers[ 'X-SSL' ] = 'true';

  new Middleware( req, res );

}

/**
 * Middleware Router
 *
 * @param req
 * @param res
 * @constructor
 */
function Middleware( req, res ) {
  // console.log( 'Middleware', req.host );

  req.releaseType = req.headers[ 'x-app-branch' ] || 'production';

  var options = {
    target: getTarget( req, req.releaseType )
  };

  res.setHeader( 'x-via', 'docker-proxy' );

  if( !options.target ) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('dockerProxy - Request can not be proxied, no target found.' + '\n' + JSON.stringify(req.headers, true, 2));
    res.end();
  }

  if( options.target ) {
    proxy.web( req, res, options );
  }

}

/**
 * Callback for Listening Server
 *
 */
function serverReady () {
  console.log( 'serverReady', this.address() )
}

/**
 *
 * @param domain
 * @returns {context|Credentials.context|REPLServer.context|Interface.context|Interface.repl.context}
 */
function getSecureContext (domain) {
  // console.log( 'getSecureContext', domain );

  var crypto = require('crypto');

  try {

    var _result = crypto.createCredentials({
      pfx: fs.readFileSync('/etc/ssl/pfx/' + domain + '.pfx' )
    }).context;

  } catch( error ) {
    console.error( 'getSecureContext:error', error.message );
  }

  return _result;

}

/**
 * Start HTTP(s) Servers
 *
 * @param routes
 */
function startServers( ) {
  console.log( 'startServers' );

  var http = require('http');
  var https = require('https');

  loadRoutes( process.env.DOCKER_PROXY_CONFIG_PATH || '/etc/docker-proxy/docker-proxy.yaml' );

  var secureContext = {
    'ud-dev.com': getSecureContext('ud-dev.com'),
    'api.usabilitydynamics.com': getSecureContext('usabilitydynamics.com'),
    'www.usabilitydynamics.com': getSecureContext('usabilitydynamics.com'),
    'sites.usabilitydynamics.com': getSecureContext('usabilitydynamics.com'),
    'usabilitydynamics.com': getSecureContext('usabilitydynamics.com')
  }

  http.createServer( Middleware ).listen( 80, '0.0.0.0', serverReady );

  https.createServer( {
    pfx: fs.readFileSync('/etc/ssl/pfx/docker-proxy.pfx' ),
    SNICallback: function SNICallback(domain) {
      console.log( 'SNICallback', domain );
      return secureContext[domain];
    }
  }, SecureMiddleware ).listen( 443, '0.0.0.0', serverReady );

}

/**
 *
 * @param path
 * @returns {*}
 */
function loadRoutes( path ) {
  console.log( 'loadRoutes', path );

  module.set( 'routes', {
    production: {
      localhost: 'http://10.0.0.8:80'
    },
    staging: {
      localhost: 'http://10.0.0.8:80'
    }
  });

  if( !fs.existsSync( path ) ) {
    return module.get();
  }

  watchr.watch({
    path: path,
    listener: function( type, path, detail ) {

      // Blacnk Out Settings
      module.set( 'routes', null );

      // Write new Settings
      module.set( 'routes', yaml.load( fs.readFileSync( path )).routes );

      // also re-fetch available containers
      getDockerContainers();

      // @debug
      console.log( 'change', module.get( 'routes' ) );

    }
  });

  module.set( yaml.load( fs.readFileSync( path ) ) );

  return module.get( 'routes' );

}

/**
 * Fetch Docker Containers from Docker Host
 *
 * @todo Add privatePorts/publicPorts object-map to get all ports, not just the first.
 *
 * @param config
 * @param done
 */
function getDockerContainers( config, done ) {
  console.log( 'getDockerContainers' );

  var _containers = module.get( 'containers' );
  // var _targets = module.get( 'targets' );

  if( 'function' !== typeof done ) {
    done = function( data ) {
      // console.log( data );
    }
  }

  request.get({
    json: true,
    url: module.get( 'docker' ) + '/containers/json'
  }, requestCallback );

  function requestCallback( error, req, containers ) {
    // console.log( 'getDockerContainers', containers );

    containers.forEach( function( data ) {

      // remove slash in beginning of name
      var name = data.Names[0].replace( '/', '' );

      _containers[ name ] = {
        id: data.Id,
        created: data.Created,
        image: data.Image,
        status: data.Status,
        ip: undefined,
        gateway: undefined,
        ports: {}
      };

      getDockerContainer( data.Id, _containers[ name ] );

      // _targets[ name + ':' + data.Ports[0].PrivatePort ] = '';

    });

    return done( error, containers );

  }

}

/**
 * Get Single Container
 *
 * @param id
 * @param obj
 */
function getDockerContainer( id, obj ) {
  // console.log( 'getDockerContainers', id );

  request.get({
    json: true,
    url: module.get( 'docker' ) + '/containers/' + id + '/json'
  }, function( error, req, body ) {
    console.log( 'getDockerContainer', id, body.NetworkSettings );

    extend( obj, {
      ip: body.NetworkSettings.IPAddress,
      gateway: body.NetworkSettings.Gateway,
      ports: body.NetworkSettings.Ports
    });

    //console.log( require( 'util').inspect( body.NetworkSettings, { colors: true , depth:5, showHidden: false } ) );

  });

}

/**
 * Get Target Container
 *
 * @todo Use req.path for target search.
 * @param req
 * @returns {*}
 */
function getTarget( req, type ) {
  console.log( 'getTarget', req.headers.host );

  var _name = {
    requestHost: req.headers.host,
    full: module.get( 'routes' )[ req.headers.host ] || '',
    type: type || 'production',
    path: req.url,
    host: undefined,
    port: undefined
  };

  _name.host = _name.full.split( ':' )[0] || 'localhost';
  _name.port = _name.full.split( ':' )[1] || 80;

  _name.match = module.get( 'containers' )[ [ _name.host, _name.type ].join( '.' ) ] || null;

  if( !_name.match ) {
    _name.match =module.get( 'containers' )[ [ _name.host, 'production' ].join( '.' ) ] || null;
    _name.type = 'production';
  }

  if( !_name.match ) {
    _name.match = module.get( 'containers' )[ _name.host ];
    _name.type = '';
  }

  _name.match = _name.match || {};

  _name.target = [ 'http://', _name.match.ip, ':', _name.port ].join( '' );

  console.log( '-', _name.target.green, _name.type.grey, _name.requestHost.cyan, ( _name.path ).substring( 0, 50 ).cyan );

  return _name.target;

}

/**
 * Handles Uncaught Errors
 *
 * @param err
 */
function uncaughtException(err) {

  if(err.errno === 'EADDRINUSE') {
    console.log( 'Address already in use, can not start servers.' );
  } else {
    console.log( 'Error!', err.message );

    // re-fetch containers
    getDockerContainers();

  }

}

/**
 * Start Servers
 *
 */
function startService() {
  console.log( 'startService' );

  require('object-emitter').mixin( module );
  require('object-settings').mixin( module );

  process.on('uncaughtException', uncaughtException );

  module.set({
    config: process.env.DOCKER_PROXY_CONFIG_PATH || '/etc/docker-proxy/docker-proxy.yaml',
    docker: process.env.DOCKER_HOST.replace( 'tcp:', 'http:' ),
    targets: {},
    containers: {}
  });

  getDockerContainers();

  startServers();

}
