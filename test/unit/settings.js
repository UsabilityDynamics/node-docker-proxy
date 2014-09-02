/**
 * Docker Proxy default tests.
 *
 * DOCKER_HOST=localhost DOCKER_PORT=2375 mocha --watch
 *
 */
module.exports = {

  before: function( done ) {

    module.service = require( '../../lib/docker-proxy' ).service( function myService( error, service ) {

      service.once( 'ready', done );

    });

},

  Settings: {

    'can be parsed from YAML.': function() {

      module.service.get( 'service' ).should.have.property( 'daemon' );
      module.service.get( 'service' ).should.have.property( 'api' );
      module.service.get( 'service' ).should.have.property( 'proxy' );

    },

    'settings changes can have bound event callbacks.': function( done ) {

      module.service.settings.on( 'set.docker.host', function() {
        arguments.should.have.property( 0, null );
        arguments.should.have.property( 1, 'my-host.loc' );
        arguments.should.have.property( 2, 'docker.host' );
        done();
      });

      module.service.set( 'docker.host', 'my-host.loc');

    }

  }
};