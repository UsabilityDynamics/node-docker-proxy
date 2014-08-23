/**
 *
 * export DOCKER_HOST=localhost
 * export DOCKER_PORT=16423
 *
 * DOCKER_HOST=http://fallujah DOCKER_PORT=16423 mocha test/functional/docker.js
 * DOCKER_HOST=http://fallujah DOCKER_PORT=16423 mocha --watch
 *
 */
module.exports = {

  /**
   * Prepare Request Client and Shared Validation Method(s).
   *
   */
  before: function ( ready ) {

    var _host = process.env.DOCKER_HOST.replace( 'tcp://', '' ) || 'http://localhost';

    var options = {
      socketPath: false,
      protocol: 'http',
      host: _host.split( ':' )[0],
      port: process.env.DOCKER_PORT || '2375'
    };

    var Docker = require( 'dockerode' );
    var DockerEvents = require( 'docker-events' );
    this.docker = new Docker( options );

    this.emitter = new DockerEvents({
      docker: this.docker
    }).start();

    this.emitter.on( "error", function ( error ) {
      // console.log( "error", arguments );

      if( error.code === 'ECONNREFUSED' ) {
        return ready( new Error( 'Unable to connect to Docker, verify host/port is valid.' ) );
      }

      ready( error.message );

    });

    this.emitter.on( "connect", function () {
      // console.log( "connected to docker api" );

      ready();

    });

    this.emitter.on( "_message", function ( message ) {
      console.log( require( 'util' ).inspect( message, { colors: true, depth: 5, showHidden: false } ) );
    } );

    this.emitter.on( "create", function ( message ) {
      console.log( require( 'util' ).inspect( message, { colors: true, depth: 5, showHidden: false } ) );
    } );

    this.emitter.on( "start", function ( message ) {
      console.log( require( 'util' ).inspect( message, { colors: true, depth: 5, showHidden: false } ) );
    } );

    this.emitter.on( "restart", function ( message ) {
      console.log( require( 'util' ).inspect( message, { colors: true, depth: 5, showHidden: false } ) );
    } );

    this.emitter.on( "stop", function ( message ) {
      console.log( require( 'util' ).inspect( message, { colors: true, depth: 5, showHidden: false } ) );
    } );

    this.emitter.on( "die", function ( message ) {
      console.log( require( 'util' ).inspect( message, { colors: true, depth: 5, showHidden: false } ) );
    } );

    this.emitter.on( "destroy", function ( message ) {
      console.log( require( 'util' ).inspect( message, { colors: true, depth: 5, showHidden: false } ) );
    } );

  },

  'can list active containers.': function ( done ) {

    this.timeout( 100000 );

    var docker = this.docker;

    docker.listContainers( { all: 0 }, function ( err, containers ) {

      done();

    } );

  },

  'can stop containers.': function ( done ) {

    this.timeout( 100000 );

    var docker = this.docker;

    docker.listContainers( function ( err, containers ) {

      console.log( require( 'util').inspect( containers, { colors: true , depth:5, showHidden: false } ) );

      containers.forEach( function ( containerInfo ) {

        //console.log( require( 'util').inspect( containerInfo, { colors: true , depth:5, showHidden: false } ) );

        docker.getContainer( containerInfo.Id ).stop( done );

      } );


      done();

    } );

  },

  'can list all containers and restart containers.': function ( done ) {

    this.timeout( 100000 );

    var docker = this.docker;

    docker.listContainers( { all: 1 }, function ( err, containers ) {

      containers.forEach( function ( containerInfo ) {

        docker.getContainer( containerInfo.Id ).restart(function() {
          // console.log( 'restarted' );
        });

      });

      done();

    });

  },

  'can monitor': {

    "create event": function ( done ) {

      this.timeout( 100000 );

      this.emitter.on( "disconnect", function () {
        console.log( "disconnected to docker api; reconnecting" );
      } );

      done();

    }

  }

};