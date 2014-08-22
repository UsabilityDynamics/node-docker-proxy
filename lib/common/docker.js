Object.defineProperties(module.exports, {
  findByName: {
    /**
     * Find by name Key
     *
     * @param collection
     * @param _id
     * @param cb
     */
    value: function findByName(collection, name, cb){
      var coll = collection.slice( 0 ); // create a clone

      (function _loop( data ) {
        if( data.name === name ) {
          cb.apply( null, [ data ] );
        }
        else if( coll.length ) {
          setTimeout( _loop.bind( null, coll.shift() ), 25 );
        }
      }( coll.shift() ));
    },
    writable: true
  },
  findByHost: {
    /**
     * Find by "host" key.
     *
     * @param collection
     * @param host
     * @param cb
     */
    value: function findByHost(collection, host, cb){
      var coll = collection.slice( 0 ); // create a clone

      (function _loop( data ) {

        if( data.host === host || data.domain === host ) {
          cb.apply( null, [ data ] );
        }

        else if( coll.length ) {
          setTimeout( _loop.bind( null, coll.shift() ), 25 );
        }
      }( coll.shift() ));
    },
    writable: true
  },
  findByDomain: {
    /**
     * Find by "domain" key.
     *
     * @param collection
     * @param host
     * @param cb
     */
    value: function findByDomain(collection, host, cb){
      var coll = collection.slice( 0 ); // create a clone

      (function _loop( data ) {

        data.domain = data.domain || [ data.Config.Hostname, data.Config.Domainname].join( '.' );

        console.log( data.domain, '-', host );

        if( data.domain === host ) {
          cb.apply( null, [ data ] );
        }

        else if( coll.length ) {
          setTimeout( _loop.bind( null, coll.shift() ), 25 );
        }
      }( coll.shift() ));
    },
    writable: true
  },
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