/**
 * Test Shared Veneer.io Service APIs
 *
 *
 * DOCKER_HOST=http://fallujah DOCKER_PORT=16423  mocha --watch
 *
 */
module.exports = {

  'Docker Proxy': {

    'ORM': require( './unit/orm' ),

    'Utility': require( './unit/utility' ),

    'Docker Daemon': require( './functional/docker' )

  }

};