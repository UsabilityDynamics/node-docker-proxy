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
  before: function () {

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

    this.emitter = new DockerEvents( {
      docker: this.docker
    } );

  },

  'can list containers.': function ( done ) {

    this.timeout( 100000 );

    var docker = this.docker;

    docker.listContainers( function ( err, containers ) {

      done();

    } );

  },

  'can stop containers.': function ( done ) {

    this.timeout( 100000 );

    var docker = this.docker;

    docker.listContainers( function ( err, containers ) {

      containers.forEach( function ( containerInfo ) {

        docker.getContainer( containerInfo.Id ).stop(function() {
          // console.log( 'stopped' );
        });


      } );

      done();

    } );

  },

  'can restart containers.': function ( done ) {

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

    "connect event": function ( done ) {

      this.timeout( 100000 );

      this.emitter.start();

      this.emitter.on( "connect", function () {
        // console.log( "connected to docker api" );

        done();

        //setTimeout( done, 2000 );

      } );

      this.emitter.on( "disconnect", function () {
        console.log( "disconnected to docker api; reconnecting" );
      } );

      this.emitter.on( "_message", function ( message ) {
        console.log( require( 'util' ).inspect( message, { colors: true, depth: 5, showHidden: false } ) );
      } );

      this.emitter.on( "create", function ( message ) {
        console.log( require( 'util' ).inspect( message, { colors: true, depth: 5, showHidden: false } ) );
      } );

      this.emitter.on( "start", function ( message ) {
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

    }

  }

};