/**
 * Test Shared Docker.io Service APIs
 *
 *
 * mocha test/unit/orm.js
 * mocha --watch test/unit/orm.js
 *
 * * site1.com - gets (site1.com)
 * * www.site1.com - gets (site1.com)
 * * cdn.site1.com - gets (site1.com) due to wildcard match
 * * media.site1.com - gets (site1.com) due to wildcard match
 * * api.site1.com - gets (api.site1.com) a custom container, not the wildcard match
 *
 * * site2.com - should get (site2.com)
 * * www.site2.com - should get (site2.com) because we strip out "www"
 * * api.site2.com - should fail because there is wildcard support on site2.com
 *
 */
module.exports = {

  /**
   * Prepare Request Client and Shared Validation Method(s).
   *
   */
  before: function () {

    module.debug = require( 'debug' )( 'docker:proxy:unit' );

    module.dummyData = {
      image: require( 'waterline' ).Collection.extend(require( '../../lib/models/image' )),
      container: require( 'waterline' ).Collection.extend(require( '../../lib/models/container' )),
      backend: require( 'waterline' ).Collection.extend(require( '../../lib/models/backend' )),
    };

    module.Waterline = require( 'waterline' );
    module.orm = module.Waterline();

    module.waterlineConfig = {
      adapters: {
        docker: require( 'waterline-docker' ),
        memory: require( 'sails-memory' ),
        disk: require( 'sails-disk' )
      },
      collections: {
        image: require( '../../lib/models/image' ),
        container: require( '../../lib/models/container' ),
        backend: require( '../../lib/models/backend' ),
      },
      connections: {
        docker: {
          adapter: 'docker'
        },
        memory: {
          adapter: 'memory'
        },
        disk: {
          adapter: 'disk'
        },
        persistent: {
          adapter: 'disk'
        },
        runtime: {
          adapter: 'memory'
        }
      }
    }

  },

  Server: {}

};