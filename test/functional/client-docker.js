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

      var _docker = module.DockerClient.create({
        socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
        host: process.env.DOCKER_HOSTNAME,
        port: process.env.DOCKER_PORT
      }).on( 'ready', done );

      _docker.should.have.properties( 'on', 'off', 'emit', 'docker' );

      _docker.docker.should.have.properties(
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
      _docker.docker.should.have.properties(
        'getEvents',
        'buildImage',
        'createImage'
      );

    },

    'can iterate through containers': function ( done ) {

      this.timeout( 50000 );

      var _docker = module.DockerClient.create({
        socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
        host: process.env.DOCKER_HOSTNAME,
        port: process.env.DOCKER_PORT
      });

      //_docker.getContainer( '604a6d14677d' ).attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
      //  stream.pipe(process.stdout);
      //});

      _docker.listContainers(function (err, containers) {

        var _detail = [];

        containers.forEach(function (containerInfo) {

          _docker.getContainer(containerInfo.Id).inspect(function( error, detail ) {
            _detail.push( detail );
          });

        });

        // 200 ms seems enough to iterate
        setTimeout( function() {
          // console.log( require( 'util').inspect( _detail, { colors: true , depth:1, showHidden: false } ) );
          done();
        }, 200 )

      });

    }

  }

};