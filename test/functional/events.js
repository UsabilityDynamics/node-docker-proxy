/**
 * Test Shared Veneer.io Service APIs
 *
 *
 * DOCKER_HOST=fallujah DOCKER_PORT=16423  mocha test/functional/events.js
 *
 */
module.exports = {

  /**
   * Prepare Request Client and Shared Validation Method(s).
   *
   */
  before: function() {

    var Docker = require('dockerode');
    var DockerEvents = require('docker-events');

    var options = {
      socketPath: false,
      host: process.env.DOCKER_HOST.replace( 'tcp://', '' ) || 'localhost',
      protocol: 'http',
      port: process.env.DOCKER_PORT || '2375'
    };

    console.log( require( 'util').inspect( options, { colors: true , depth:5, showHidden: false } ) );

    this.emitter = new DockerEvents({
      docker: new Docker(options)
    });

    this.dockernode = new Docker( options );

  },

  "vProxy events": {

    'can listContainers': function( done ) {

      this.timeout( 100000 );

      var docker = this.dockernode;

      docker.listContainers(function (err, containers) {

        console.log( require( 'util').inspect( containers, { colors: true , depth:1, showHidden: false } ) );

        done();

      });

    },

    'can stop containers': function( done ) {

      this.timeout( 100000 );

      var docker = this.dockernode;

      docker.listContainers(function (err, containers) {

        containers.forEach(function (containerInfo) {

          //console.log( require( 'util').inspect( containerInfo, { colors: true , depth:5, showHidden: false } ) );

          docker.getContainer(containerInfo.Id).stop( done );

        });


        done();

      });

    },

    'can events': function( done ) {

      var emitter = this.emitter;

      this.timeout( 100000 );

      this.emitter.start();

      this.emitter.on("connect", function() {
        console.log("connected to docker api");

        // done();
      });


      emitter.on("disconnect", function() {
        console.log("disconnected to docker api; reconnecting");
      });

      emitter.on("_message", function(message) {
        console.log( require( 'util').inspect( message, { colors: true , depth:5, showHidden: false } ) );
        //console.log("got a message from docker: %j", message);
      });

      emitter.on("create", function(message) {
        console.log( require( 'util').inspect( message, { colors: true , depth:5, showHidden: false } ) );
      });

      emitter.on("start", function(message) {
        console.log( require( 'util').inspect( message, { colors: true , depth:5, showHidden: false } ) );
      });

      emitter.on("stop", function(message) {
        console.log( require( 'util').inspect( message, { colors: true , depth:5, showHidden: false } ) );
      });

      emitter.on("die", function(message) {
        console.log( require( 'util').inspect( message, { colors: true , depth:5, showHidden: false } ) );
      });

      emitter.on("destroy", function(message) {
        console.log( require( 'util').inspect( message, { colors: true , depth:5, showHidden: false } ) );
      });


      return;

      return done();

      this.timeout( 1000000 );

      this.docker.events( function( error, data ) {

        data.req.on( 'data', console.log );
        //console.log( 'events', data.req.res );


      });

    }

  }

};