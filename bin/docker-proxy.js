#!/usr/bin/env node
//
// sudo DEBUG=docker:proxy supervisor -w ./ -- ./bin/docker-proxy.js start
// node ./bin/docker-proxy.js start

var dockerProxy = require( '../' );
var commander  = require( 'commander' );
var os = require( 'os' );
var pid = require( '../lib/common/pid' );

commander._name = require( '../package' ).name;

commander
  .version( require( '../package' ).version )
  .option( '-q', 'quiet', 'Silence console output.' )

commander.command( 'start' )
  .option( '-p, --port [port]', 'Which port use for public proxy.', process.env.DOCKER_PROXY_API_PORT || process.env.PORT || 8080 )
  .option( '-h, --address [address]', 'IP address for public proxy.', process.env.DOCKER_PROXY_API_HOST || process.env.HOST || '0.0.0.0' )
  .option( '-s, --silent [silent]', 'silence worker logs', process.env.DOCKER_PROXY_SILENT == 'false' ? false : true )
  .option( '-d, --docker-daemon [dockerDaemon]', 'Hostname or unix sock path to Docker Daemon.', process.env.DOCKER_PROXY_DOCKER_DAEMON || process.env.DOCKER_HOST || process.env.DOCKER_SOCK_PATH || '/var/run/docker.sock' )
  .option( '-c, --config-path [configPath]', 'Path to SSL certificates.', process.env.DOCKER_PROXY_CONFIG_FILE_PATH || './static/etc/docker-proxy.yaml' )
  .option( '--ssl-port [sslPort]', 'SSL port for proxy.', process.env.sslPort || 8443 )
  .option( '--api-port [apiPort]', 'Path to SSL certificates.', process.env.DOCKER_PROXY_API_PORT || 16000 )
  .option( '--api-address [apiAddress]', 'Path to SSL certificates.', process.env.DOCKER_PROXY_API_ADDRESS || '0.0.0.0' )
  .option( '--public-path [publicPath]', 'Path to static public files.', process.env.DOCKER_PROXY_PUBLIC_PATH ? process.env.DOCKER_PROXY_PUBLIC_PATH : './static/public' )
  .option( '--ssl-path [sslPath]', 'Path to SSL certificates.', process.env.DOCKER_PROXY_SSL_DIR ? process.env.DOCKER_PROXY_SSL_DIR : '/etc/ssl' )
  .option( '--pid-path [pidPath]', 'Path to PID file to use.', process.env.DOCKER_PROXY_PID_PATH ? process.env.DOCKER_PROXY_PID_PATH : require( 'path' ).join( process.env.TMPDIR || process.env.TEMP, 'docker-proxy.pid' ) )
  .action( startService )

commander.command( 'status' )
  .option( '-w, --watch', 'Watch for changes.' )
  .action( getStatus );

commander.command( 'install' )
  .action( require( '../lib/tasks/install' ) );

if( process.argv.length === 2 ) {
  process.argv.push('--help' );
}

commander.parse( process.argv );

/**
 * Start Service.
 *
 * @param settings
 */
function startService( settings ) {

  process.env.DOCKER_PROXY_CONFIG_FILE_PATH   = settings.configPath;
  process.env.DOCKER_PROXY_DOCKER_DAEMON      = settings.dockerDaemon;
  process.env.DOCKER_PROXY_SILENT             = settings.silent;
  process.env.DOCKER_PROXY_PORT               = settings.port;
  process.env.DOCKER_PROXY_SSL_PORT           = settings.sslPort;
  process.env.DOCKER_PROXY_ADDRESS            = settings.address;
  process.env.DOCKER_PROXY_API_PORT           = settings.apiPort;
  process.env.DOCKER_PROXY_API_ADDRESS        = settings.apiAddress;
  process.env.DOCKER_PROXY_SSL_DIR            = settings.sslPath;
  process.env.DOCKER_PROXY_PUBLIC_PATH        = settings.publicPath;
  process.env.DOCKER_PROXY_PID_PATH           = settings.pidPath;
  process.env.DOCKER_PROXY_SILENT             = settings.silent;

  try {

    pid.create({
      path : settings.pidPath,
      errorOnExist: true,
      deleteOnExit : true
    });

  } catch( error ) {}

  require( '../lib/services/daemon' ).startService();

}

/**
 * Show Status
 *
 * @todo Get all active docker-proxy PIDs.
 * @param settings
 */
function getStatus( settings ) {
  console.log( 'wip' );

  var MonitorPid = require('monitor-pid');

  var mapp = new MonitorPid(5253, { period: 5000 });

  mapp.start();

  mapp.on('monitored', function (pid, stats) {
    console.error('monitored', pid, stats);
  });

  mapp.on('end', function (pid) {
    console.error('end', pid);
  });

}
