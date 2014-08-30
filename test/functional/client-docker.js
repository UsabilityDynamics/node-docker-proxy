/**
 * Test Shared Docker.io Service APIs
 *
 */
module.exports = {

  "client/docker": {

    'can instantiate and emit a :ready event.': function( done ) {

      var DockerEvents = require( '../../lib/clients/docker.js' );

      DockerEvents.should.have.property( 'create' );

      var _docker = DockerEvents.create({
        socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
        host: process.env.DOCKER_HOSTNAME,
        port: process.env.DOCKER_PORT
      }).on( 'ready', done );

      _docker.should.have.properties( 'on', 'off', 'emit', 'docker' );

      _docker.docker.should.have.properties(
        'getEvents',
        'getContainer',
        'listContainers',
        'buildImage',
        'createContainer',
        'createImage',
        'run',
        'pull'
      );


    }

  }

};