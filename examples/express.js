/**
 * This is a sample setup of how Docker Proxy is intended to be used.
 *
 *
 */
var express       = require( 'express');
var bodyParser    = require( 'body-parser' );
var serveStatic   = require( 'serve-static' );
var waterline     = require( 'waterline');

exports = express();

exports.use( bodyParser.urlencoded( {
  extended: false
}));

exports.use( waterline.Middleware({
  adapters: {
    disk: require( 'sails-disk' ),
    memory: require( 'sails-memory' ),
    redis: require( 'sails-redis' )
  },
  collections: {
    server: require( 'connect-proxy-models' ).Server,
    route: require( 'connect-proxy-models' ).Route,
    backend: require( 'connect-proxy-models' ).Backend,
    container: require( '../lib/models/container' ),
    image: require( '../lib/models/image' )
  },
  connections: {
    clusterStore: {
      adapter: 'redis',
      config: {
        port: 6379,
        host: 'localhost',
        password: null,
        options: {
          parser: 'hiredis',
          return_buffers: false,
          detect_buffers: false,
          socket_nodelay: true,
          no_ready_check: false,
          enable_offline_queue: true
        }
      }
    },
    fileStore: {
      adapter: 'disk'
    },
    memoryStore: {
      adapter: 'disk'
    },
  }
}));

exports.use( serveStatic( './public', {
  index: [ 'index.html' ]
} ));

exports.listen( process.env.DOCKER_PROXY_PORT || 8080, process.env.DOCKER_PROXY_HOSTNAME || '0.0.0.0', function() {
  console.log( 'Docker Proxy example server started on %s:%s.', this.address().address, this.address().port );
});

exports.once( 'waterline:models:ready', function( error, models ) {
  console.log( 'waterline:models:ready', error || typeof models );

  var fakeData = {
    backends: require( './fixtures/backends' ),
    images: require( './fixtures/images' ),
    containers: require( './fixtures/containers' ),
    routes: require( './fixtures/routes' ),
    servers: require( './fixtures/servers' )
  }

  exports.models.server.createEach( fakeData.servers, exports.emit.bind( exports, 'model:server:created', null ) );
  exports.models.backend.createEach( fakeData.backends, exports.emit.bind( exports, 'model:server:created', null ) );
  exports.models.image.createEach( fakeData.images, exports.emit.bind( exports, 'model:server:created', null ) );
  exports.models.container.createEach( fakeData.container, exports.emit.bind( exports, 'model:server:created', null ) );

});
