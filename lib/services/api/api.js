/**
 * Veneer Proxy API
 *
 *
 * ### Development Start
 *
 *    export VENEER_SCALE_LIMIT=1 && export VENEER_WORKER_OUTPUT=true && export VENEER_SERVICE_BIND_ADDRESS=0.0.0.0
 *    VENEER_SERVICE_BIND_PORT=16020 supervisor --no-restart-on exit --watch bin,lib --quiet --harmony -- lib/services/daemon
 *
 * ### Development Start Without Reload
 *
 *    VENEER_SERVICE_BIND_PORT=16020 node --harmony lib/services/daemon
 *
 * @version 0.1.0
 * @author potanin@UD
 * @extends Veneer Service
 * @constructor
 * @type {*}
 */
require( 'veneer-service' ).create( function veneerProxyApi( error, app ) {
  app.log( 'Initializing Veneer Proxy API.' );

  // Configure Dynamic Settings.
  app.set( 'broker', {
    url: 'amqp://vproxy@veneer.io:dtksbokyqiljyvqq@broker.uds.io:11100/veneer.io',
    clientProperties: {
      product: 'veneer-proxy',
      platform: process.platform,
      pid: process.pid,
      arch: process.arch,
      hostname: require( 'os' ).hostname(),
      version: require( '../../../package.json' ).version
    }
  });

  // Initialize Haproxy defaults.
  require( 'haproxy' ).setDeafults({
    pidFile: '/var/run/veneer/veneer-proxy:haproxy.pid',
    socket: '/tmp/veneer-proxy/haproxy.uds.vproxy',
    config: '/etc/haproxy/uds.vproxy.cfg',
    which: '/usr/local/sbin/haproxy'
  });

  // Server Bound Callback.
  app.once( 'server.bound', onceBound );

  // API Methods.
  app.use( '/route',    require( './middleware/route' ) );
  app.use( '/service',  require( './middleware/service' ) );
  app.use( '/domain',   require( './middleware/domain' ) );

  // Default HTTP response.
  app.use( defaultSplash );

}, module );

/**
 * Default Splash
 *
 * @param req
 * @param res
 */
function defaultSplash( req, res ) {
  res.send( '<html><head></head><body style="text-align: center;padding-top: 5em;background-color: rgb(44, 33, 33)"><img src="//cdn.veneer.io/veneer-daemon.png" alt="Veneer Proxy API"/></body></html>' );
}

/**
 * Server Bind Callback
 *
 * @param error
 * @param server
 */
function onceBound( error, server ) {
  var veneer    = require( 'veneer' );
  var request   = require( 'request' );

  veneer.log( require( 'util' ).format( 'Veneer Proxy API bound on [http://%s:%s].', server.address().address, server.address().port ) );

  // Get all Routes
  veneer.response( 'route.list',      function handleResponse( req, res ) { request.get({ qs: req.params, url: [ 'http://', server.address().address, ':', server.address().port, '/route/list'     ].join( '' ) }).pipe( res ); });
  veneer.response( 'route.add',       function handleResponse( req, res ) { request.get({ qs: req.params, url: [ 'http://', server.address().address, ':', server.address().port, '/route/add'      ].join( '' ) }).pipe( res ); });
  veneer.response( 'service.info',    function handleResponse( req, res ) { request.get({ qs: req.params, url: [ 'http://', server.address().address, ':', server.address().port, '/service/info'   ].join( '' ) }).pipe( res ); });
  veneer.response( 'service.stop',    function handleResponse( req, res ) { request.get({ qs: req.params, url: [ 'http://', server.address().address, ':', server.address().port, '/service/stop'   ].join( '' ) }).pipe( res ); });
  veneer.response( 'service.start',   function handleResponse( req, res ) { request.get({ qs: req.params, url: [ 'http://', server.address().address, ':', server.address().port, '/service/start'  ].join( '' ) }).pipe( res ); });
  veneer.response( 'service.reload',  function handleResponse( req, res ) { request.get({ qs: req.params, url: [ 'http://', server.address().address, ':', server.address().port, '/service/reload' ].join( '' ) }).pipe( res ); });

}

/**
 * AMQP Connection Callback
 *
 * @param connection
 */
function onBrokerConnection( connection ) {
  app.log( connection instanceof Error ? 'Broker connection failed.' : 'Broker connection open.' );

  // Close on shutdown.
  process.once( 'SIGINT', function() {
    require( 'veneer' ).log( 'Service shutting down.' );
    connection.close.bind( connection );
  });

}

