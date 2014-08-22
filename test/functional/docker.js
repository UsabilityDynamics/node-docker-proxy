/**
 *
 * DOCKER_HOST=http://fallujah DOCKER_PORT=16423 mocha test/functional/docker.js
 *
 * DOCKER_HOST=http://fallujah DOCKER_PORT=16423 mocha --watch
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

    this.dockernode = new Docker( options );

    this.emitter = new DockerEvents({
      docker: this.dockernode
    });

  },

  "Docker Proxy": {

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

    'can monitor events': function( done ) {

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

    },

    'can get Docker images': function( done ) {

      this.docker.images.list(function( error, images ) {
        // console.log( require( 'util').inspect( images, { colors: true , depth:5, showHidden: false } ) );

        done();

      });

    },

    'can get Docker containers': function( done ) {

      this.docker.containers.list(function( error, containers ) {

        console.log( require( 'util').inspect( containers, { colors: true , depth:5, showHidden: false } ) );

        done();

      });

    },

    'can inspect container changes': function( done ) {

      this.timeout( 500000 );

      this.docker.containers.inspectChanges( '2c67fc4452cd030348b27cd8b15c5bd52f24470e2b2aa1d190c7b840e4e2d844', function( error, containers ) {

        console.log( require( 'util').inspect( containers, { colors: true , depth:5, showHidden: false } ) );

        done();

      });

    }

  }

};