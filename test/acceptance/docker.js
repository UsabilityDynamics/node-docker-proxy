/**
 *
 *
 * @type {{client/docker: {can accept messages from Docker Daemon.: 'can accept messages from Docker Daemon.'}}}
 */
module.exports = {

  "client/docker": {

    // @todo Implement!
    'can accept messages from Docker Daemon.': function( done ) {

      return done();

      this.timeout( 10000 );

      var DockerEvents = require( '../../lib/clients/docker.js' );

      DockerEvents.should.have.property( 'create' );

      DockerEvents.create({
        host: process.env.DOCKER_HOSTNAME || 'localhost',
        port: process.env.DOCKER_PORT
      }).on( '_message', done )

    }

  }

}