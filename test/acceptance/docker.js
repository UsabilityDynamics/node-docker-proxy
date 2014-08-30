module.exports = {


  "client/docker": {

    'can accept messages from Docker Daemon.': function( done ) {

      this.timeout( 10000 );

      var DockerEvents = require( '../../lib/clients/docker.js' );

      DockerEvents.should.have.property( 'create' );

      DockerEvents.create({
        host: process.env.DOCKER_HOSTNAME,
        port: process.env.DOCKER_PORT
      }).on( '_message', done )

    }

  }

}