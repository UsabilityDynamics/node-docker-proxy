/**
 * Start dockerProxy Services.
 *
 *  Start Veneer Proxy with Supervisor
 *  $ supervisor --no-restart-on exit --watch bin,lib --quiet --harmony -- $(which veneer-proxy) start --foreground
 *
 *  Get PID of active Varnish Process.
 *  $ pidof varnishd
 *
 *  Kill any active Varnish Processes.
 *  $ kill $(pidof varnishd)
 *  $ kill $(pidof haproxy)
 *  $ kill $(pidof nginx)
 *
 * @todo Add "Environment Validation" step that ensures:
 *    - /etc/ssl/certs directory exists (of Haproxy will fail)
 *
 * @param settings
 */
function startService( settings ) {

  var service     = this;
  var veneer      = require( 'veneer' );
  var isRunning   = require( 'is-running' );
  var readFile    = require( 'fs' ).readFile;
  var fileExists  = require( 'fs' ).existsSync;
  var auto        = require( 'async' ).auto;
  var yaml        = require( 'yaml-config' );
  var varnish     = require( 'varnish' );
  var extend      = require( 'deep-extend' );
  var spawn       = require( 'child_process' ).spawn;
  var exec        = require( 'child_process' ).exec;
  var pathJoin    = require( 'path' ).join;

  auto({

    /**
     * Adds Service to Context.
     *
     */
    service: [  function setService( next, report ) {
      next( null, service );
    }],

    /**
     * Determine Service Settings
     *
     */
    settings: [ 'service', function prepareSettings( next, report ) {
      service.log( 'Starting dockerProxy in [%s] mode.', process.env.NODE_ENV ? 'production' : 'development' );

      service.set( extend( service.get(), fileExists( settings.parent.config ) ? yaml.readConfig( settings.parent.config ) : {}, {
        foreground: !!(settings.foreground === true || settings.foreground === 'true'),
        hostname: settings.parent.hostname,
        public: {
          port: settings.port,
          address: settings.address
        },
        service: {
          dockerProxy: { uri: settings.proxy },
          vElastic: { uri: settings.elastic },
          vBroker: { uri: settings.broker }
        },
        backend: {
          Varnish: {
            id:         service.get( 'backend.Varnish.id',          'veneer-proxy:varnish' ),
            name:       service.get( 'backend.Varnish.name',        '/var/lib/veneer-proxy/varnish' ),
            vcl:        service.get( 'backend.Varnish.vcl',         pathJoin( service.get( 'base' ), 'static/etc/varnish/uds.docker-proxy.vcl' ) ),
            listen:     service.get( 'backend.Varnish.listen',      '0.0.0.0:13010' ),
            management: service.get( 'backend.Varnish.management',  '0.0.0.0:16010' ),
            workers:    service.get( 'backend.Varnish.workers',     '2,500,300' ),
            storage:    service.get( 'backend.Varnish.storage',     'malloc' ),
            shmlog:     service.get( 'backend.Varnish.shmlog',      '200M' ),
            ttl:        service.get( 'backend.Varnish.ttl',         900 ),
            pidfile:    service.get( 'backend.Varnish.pid',         '/var/run/veneer/veneer-proxy:varnish.local.pid' )
          }
        }
      }));

      next( null, service.get() );

    }],

    /**
     * Varnish not ran using veneer.run() because it has a special handler.
     *
     */
    Varnish: [ 'settings', function Varnish( next, report ) {
      service.log( 'Starting Varnish...' );

      varnish.discover(function( error, servers) {
        service.log( 'Completed Varnish discovery.' );

        if( error ) {
          service.log( new Error( 'Error with Varnish Server discovery. Message: ' + error.message ) );
        }

        if( !error && ( servers && servers.length ) ) {
          service.log( 'Was able to discover [%d] Varnish server(s), no need to start new process.', servers.length );
          return next( null, servers[0] );
        }

        report.Varnish = varnish.create( report.service.get( 'backend.Varnish' ) );

        report.Varnish.start(function startCallback( error, server ) {

          if( error && error.message ) {
            service.log( new Error( 'Did not find a Varnish process, and was unable to start new. Message: ' + error.message ) );
            return next( null, {} );
          }

          if( !server || !server.pid ) {
            return next( new Error( 'Could not start Varnish Server, no server or server.pid returned. No error returned.' ) );
          }

          service.log( 'Started new Varnish Server using [pid=%d, listen=%s].', server.pid, service.get( 'backend.Varnish.listen' ) );

          return next( null, report.Varnish );

        });

      });

    }],

    /**
     * Start Haproxy for Web Traffic.
     *
     */
    Haproxy: [ 'settings', function Haproxy( next, report ) {
      service.log( 'Starting Haproxy...', service.get( 'backend.Haproxy.path.config' ) );

      veneer.run({
        name: 'veneer-proxy:haproxy',
        command: [ 'haproxy',
          '-f', service.get( 'backend.Haproxy.path.config' )
          //'-L',  service.get( 'backend.Haproxy.name' )
        ],
        env: {
          VENEER_PROXY_ADDRESS:   process.env.VENEER_PROXY_ADDRESS  || '0.0.0.0',
          VENEER_PROXY_PORT:      process.env.VENEER_PROXY_PORT     || 8080,
          VENEER_PROXY_SSL_PORT:  process.env.VENEER_PROXY_SSL_PORT || 8443
        }
      }, next );

    }],

    /**
     * Nginx Server.
     *
     *
     */
    Nginx: [ 'settings', function Nginx( next, report ) {
      service.log( 'Starting Nginx...' );

      veneer.run({
        name: 'veneer-proxy:nginx',
        command: [
          'nginx', '-c', service.get( 'backend.Nginx.path.config' )
        ]
      }, next );

    }],

    /**
     * PageSpeed Server (Nginx)
     *
     */
    PageSpeed: [ 'settings', function PageSpeed( next, report ) {
      service.log( 'Starting PageSpeed...' );

      veneer.run({
        name: 'veneer-proxy:page-speed',
        command: [
          'nginx', '-c', service.get( 'backend.PageSpeed.path.config' )
        ]
      }, next );

    }],

    /**
     * Start Node.js API for Veneer Proxy management.
     *
     */
    Daemon: [ 'Nginx', 'Varnish', 'Haproxy', function starAPI( next, report ) {
      service.log( 'Starting Veneer Proxy API Service on [port: %s].', report.service.get( 'services.API.port' ) );

      veneer.run({
        name: 'veneer-proxy:daemon',
        command: pathJoin( service.get( 'base' ), 'lib/services/daemon' ),
        env: {
          VENEER_SERVICE_SETTINGS: JSON.stringify( service.get() ),
          VENEER_WORKER_OUTPUT: true,
          VENEER_SERVICE_BIND_ADDRESS: report.service.get( 'services.API.address' ),
          VENEER_SERVICE_BIND_PORT: report.service.get( 'services.API.port' ), // 16020
          VENEER_SCALE_LIMIT: 1
        }
      }, next );

    }],

    /**
     * Start Node.js Router.
     *
     */
    Router: [ 'settings', function startRouter( next, report ) {
      service.log( 'Starting Node Router. ');

      veneer.run({
        name: 'veneer-proxy:router',
        command: pathJoin( service.get( 'base' ), 'lib/services/router' ),
        env: {
          VENEER_SERVICE_SETTINGS: JSON.stringify( service.get() ),
          VENEER_WORKER_OUTPUT: true,
          VENEER_SERVICE_BIND_ADDRESS: report.service.get( 'services.Router.address' ),
          VENEER_SERVICE_BIND_PORT: report.service.get( 'services.Router.port' )
        }
      }, next );

    }]

  }, startService.taskComplete.bind( this ) );

}

/**
 * Constructor Properties.
 *
 */
Object.defineProperties( module.exports = startService, {
  taskComplete: {
    /**
     * Task Completion Callback.
     *
     * @param error
     * @param report
     * @returns {*}
     */
    value: function taskComplete( error, report ) {
      report.service.log( 'Finalizing start-up process.' );

      if( error ) {
        return this.log( new Error( error.message ) );
      }

      if( this.get( 'foreground' ) !== true ) {
        setTimeout( process.exit, 100 );
      }

      if( report.Varnish && report.Varnish.pid ) {
        report.service.log( 'Started Varnish with [pid=%d].', report.Varnish.pid );
      }

      if( report.Haproxy && report.Haproxy.pid ) {
        report.service.log( 'Started Haproxy with [pid=%d].', report.Haproxy.pid );
      }

      if( report.Nginx && report.Nginx.pid ) {
        report.service.log( 'Started Nginx with [pid=%d].', report.Nginx.pid );
      }

      if( report.PageSpeed && report.PageSpeed.pid ) {
        report.service.log( 'Started PageSpeed with [pid=%d].', report.PageSpeed.pid );
      }

      if( report.Daemon && report.Daemon.pid ) {
        report.service.log( 'Started dockerProxy API with [pid=%d].', report.Daemon.pid );
      }

      if( report.Router && report.Router.pid ) {
        report.service.log( 'Started dockerProxy Router with [pid=%d].', report.Router.pid );
      }

      return this.log( 'The dockerProxy service was started without issues.' );

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  debug: {
    value: require( 'debug' )( 'veneer-proxy:start' ),
    enumerable: true,
    configurable: true,
    writable: true
  }
});