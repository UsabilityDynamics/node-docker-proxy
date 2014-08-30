module.exports =  {
  waterline: {
    policies: {},
    adapters: {
      memory: require( 'sails-memory' ),
      disk: require( 'sails-disk' )
    },
    collections: {
      image: require( '../../../lib/models/image' ),
      container: require( '../../../lib/models/container' ),
      backend: require( '../../../lib/models/backend' ),
    },
    connections: {
      memory: {
        adapter: 'memory'
      },
      disk: {
        adapter: 'memory'
      },
      persistent: {
        adapter: 'disk'
      },
      runtime: {
        adapter: 'memory'
      }
    }
  },
}

var image =require( '../../../lib/models/image' );
var container = require( '../../../lib/models/container' );
var backend = require( '../../../lib/models/backend' );
