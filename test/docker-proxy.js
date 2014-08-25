/**
 * Test Shared Veneer.io Service APIs
 *
 *
 * DOCKER_HOST=http://fallujah DOCKER_PORT=16423  mocha --watch
 *
 */
module.exports = {

  'Docker Proxy': {

    'Utility': require( './unit/utility' ),

    'Waterline': require( './functional/waterline' ),

  }

};