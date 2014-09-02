/**
 * Test Shared Docker.io Service APIs
 *
 */
module.exports = {

  before: function() {

    module.DockerClient = require( '../../lib/clients/docker.js' );

  },

  "client/docker": {

    'can instantiate and emit a :ready event.': function( done ) {

      module.DockerClient.should.have.property( 'create' );

      var _sockFile = process.env.DOCKER_SOCK_PATH || '/var/run/docker.sock';

      if( require( 'fs' ).existsSync( _sockFile ) ) {

        module._docker = module.DockerClient.create({
          socketPath: _sockFile
        });

      } else {

        module._docker = module.DockerClient.create({
          host: process.env.DOCKER_HOSTNAME || 'localhost',
          port: process.env.DOCKER_PORT || 2375
        });

      }

      module._docker.on( 'ready', done );

      module._docker.should.have.properties( 'on', 'off', 'emit', 'docker' );

      module._docker.docker.should.have.properties(
        'getContainer',
        'listContainers',
        'searchImages',
        'createContainer',
        'info',
        'ping',
        'run',
        'pull'
      );

      // Streamable Methods.
      module._docker.docker.should.have.properties(
        'getEvents',
        'buildImage',
        'createImage'
      );

    },

    'can iterate through containers': function ( done ) {

      this.timeout( 10000 );

      module._docker.listContainers(function (err, containers) {

        var _detail = [];

        containers.forEach(function (containerInfo) {

          module._docker.getContainer(containerInfo.Id).inspect(function( error, detail ) {
            _detail.push( detail );
          });

        });

        // 200 ms seems enough to iterate
        setTimeout( function() {
          done();
        }, 200 )

      });

    }

  }

};