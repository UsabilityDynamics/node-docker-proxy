/**
 * message.status
 * - die - container stopping, including when manually stopped
 * - stop - container stopped (after die)
 * - start - container starting, and is now running
 * - create - new image ran
 * - start - container started, called after creation as well as directly starting
 * - destroy - When a container (or image) has been removed, the message does not specify which.
 *
 * There are no events for pausing/unpausing.
 *
 */
function DockerMonitor( options, callback ) {



}

Object.defineProperties( DockerMonitor.prototype, {
  getDockerContainers: {
    /**
     * Fetch Docker Containers from Docker Host
     *
     * @todo Add privatePorts/publicPorts object-map to get all ports, not just the first.
     *
     * @param config
     * @param done
     */
    value: function getDockerContainers(config, done) {
      console.log('getDockerContainers');

      var _containers = module.get('containers');
      // var _targets = module.get( 'targets' );

      if ('function' !== typeof done) {
        done = function (data) {
          // console.log( data );
        }
      }

      request.get({
        json: true,
        url: module.get( 'docker' ) + '/containers/json'
      }, requestCallback);

      function requestCallback(error, req, containers) {
        // console.log( 'getDockerContainers', containers );

        containers.forEach(function (data) {

          // remove slash in beginning of name
          var name = data.Names[0].replace('/', '');

          _containers[ name ] = {
            id: data.Id,
            created: data.Created,
            image: data.Image,
            status: data.Status,
            ip: undefined,
            gateway: undefined,
            ports: {}
          };

          getDockerContainer(data.Id, _containers[ name ]);

          // _targets[ name + ':' + data.Ports[0].PrivatePort ] = '';

        });

        return done(error, containers);

      }

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  getDockerContainer: {
    /**
     * Get Single Container
     *
     * @param id
     * @param obj
     */
    value: function getDockerContainer( id, obj ) {

      request.get({
        json: true,
        url: module.get( 'docker' ) + '/containers/' + id + '/json'
      }, function( error, req, body ) {
        // console.log( 'getDockerContainer', body );

        extend( obj, {
          ip: body.NetworkSettings.IPAddress,
          gateway: body.NetworkSettings.Gateway,
          ports: body.NetworkSettings.Ports
        });

        //console.log( require( 'util').inspect( body.NetworkSettings, { colors: true , depth:5, showHidden: false } ) );

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});

Object.defineProperties( module.exports = DockerMonitor, {
  start: {
    value: function start( options, cb ) {
      return new DockerMonitor( options, cb  );
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});