/**
 * Docker Proxy default tests.
 *
 * DOCKER_HOST=localhost DOCKER_PORT=2375 mocha --watch
 *
 */
module.exports = {
  Collection: require( './unit/orm.container' ),
  Backend: require( './unit/orm.backend' ),
  Image: require( './unit/orm.image' ),
  Server: require( './unit/orm.backend' ),
  Service: require( './functional/docker-proxy' )
};