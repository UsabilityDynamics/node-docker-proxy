/**
 * Test Shared Veneer.io Service APIs
 *
 *
 * DOCKER_HOST=http://fallujah DOCKER_PORT=16423  mocha --watch
 *
 */
module.exports = {

  /**
   * Prepare Request Client and Shared Validation Method(s).
   *
   */
  before: function() {

    var options = {
      socketPath: false,
      host: process.env.DOCKER_HOST.replace( 'tcp://', 'http://' ) || 'http://localhost',
      port: process.env.DOCKER_PORT || '2375'
    };

    this.docker = require('docker.io')( options );

  },

  "dockerProxy": {

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