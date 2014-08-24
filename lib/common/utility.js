Object.defineProperties( module.exports, {
  findById: {
    /**
     * Find by _id Key
     *
     * @param collection
     * @param _id
     * @param cb
     */
    value: function findById(collection, _id, cb){
      var coll = collection.slice( 0 ); // create a clone

      (function _loop( data ) {
        if( data._id === _id ) {
          cb.apply( null, [ data ] );
        }
        else if( coll.length ) {
          setTimeout( _loop.bind( null, coll.shift() ), 25 );
        }
      }( coll.shift() ));
    },
    writable: true
  }
});


getFirstPort = function(net) {
  return _.keys(net.Ports)[0].split('/')[0];
};

makeContainerAddress = function(net) {
  return 'http://' + net.IPAddress + ':' + getFirstPort(net);
};


parseProtoAddress = function(proto_address) {
  var address, proto;
  proto_address = proto_address.split('://');
  if (proto_address.length === 1) {
    proto = 'http';
    address = proto_address[0];
  } else {
    proto = proto_address[0];
    address = proto_address[1];
  }
  return [proto, address];
};

hostnameKey = function(hostname) {
  return hostname_key_prefix + hostname;
};


formatProtoAddress = function(proto, address) {
  if (address.match(/^:\d+$/)) {
    address = 'localhost' + address;
  }
  return proto + '://' + address;
};

padRight = function(s, n) {
  var s_;
  s_ = '' + s;
  while (s_.length < n) {
    s_ += ' ';
  }
  return s_;
};

ensureHostname = function(hostname, cb) {
  return redis.llen(hostnameKey(hostname), function(err, l) {
    if (l < 1) {
      return redis.rpush(hostnameKey(hostname), hostname, cb);
    } else {
      return cb();
    }
  });
};


getAllContainers = function(cb) {
  return docker.listContainers(function(err, containers) {
    return async.map(containers, function(container, _cb) {
      return docker.getContainer(container.Id).inspect(function(err, full_container) {
        container.Address = makeContainerAddress(full_container.NetworkSettings);
        container.ShortId = container.Id.slice(0, 12);
        address_containers[container.Address] = container;
        container_image_names[container.Id] = container.Image;
        return _cb(null, container);
      });
    }, cb);
  });
};




