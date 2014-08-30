/**
 * Docker Proxy default tests.
 *
 * DOCKER_HOST=http://fallujah DOCKER_PORT=16423 mocha --watch
 *
 */
module.exports = {
  Collection: require( './unit/orm.container' ),
  Backend: require( './unit/orm.backend' ),
  // Image: require( './unit/orm.image' ),
  Server: require( './unit/orm.backend' )
};