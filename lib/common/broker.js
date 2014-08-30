/**
 *
 */
Object.defineProperties( module.exports, {
  startService: {
    value: function startService() {

      var axon = require( 'axon' );
      var express = require( 'express' );
      var httpProxy = require( 'http-proxy' );

      var app = express();

      module.exports.sock = axon.socket( 'pub' );

      module.exports.sock.bind(process.env.VPROXY_BROKER_TCP_PORT || 16000, process.env.VPROXY_BROKER_TCP_HOST || 'localhost', brokerServerStarted);

      app.listen(process.env.VPROXY_BROKER_API_PORT || 9210, process.env.VPROXY_BROKER_API_HOST || 'localhost', proxyServerStarted);

      app.backendProxy = httpProxy.createProxyServer({
        xfwd: true,
        target: {
          host: process.env.ES_HOST || process.env.ELASTICSEARCH_HOST || 'localhost',
          port: process.env.ES_PORT || process.env.ELASTICSEARCH_PORT || 9200
        }
      });

      app.backendProxy.on('proxyRes', proxyResponse);

      app.route('/:index/:type/:id')
        .delete(documentChange)
        .put(documentChange)
        .post(documentChange);

      app.route('/:index/:type/_settings')
        .post(settingsUpdate)
        .put(settingsUpdate);

      app.route('/:index/:type/_search')
        .get(documentSearch);

      app.route('/_bulk')
        .put(bulkRequest)
        .post(bulkRequest);

      app.use(transparentForward.bind(app));

      module.exports.checkBackend();

      return app;

    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  stopService: {
    value: function stopService() {
      console.log('stopService not implemented');

    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  broadcast: {
    /**
     *
     * @param error
     * @param body
     * @constructor
     */
    value: function generalMessage( error, body, request ) {

      try {

        body = JSON.parse(body);

      } catch (error) {

        body = {
          ok: false,
          error: 'Unable to parse JSON.',
          body: body
        }

      }

      var _topic = [];

      // First one is most likely a document. Otherwose its hard to guess so we just use the path.
      if (body._index && body._type && body._id) {
        _topic.push('/', body._index, '/', body._type, '/', body._id, '/');
      } else {
        _topic.push(request.path.replace(/\//, "").replace(/\//gi, ":"));
      }

      _topic.push(request.method);

      body._method = request.method;
      body._path = require('url').parse(request.path).pathame;
      body._url = request.path;
      body._topic = ( _topic.join('') ).replace(/\//, "").replace(/\./gi, ":").replace(/\//gi, ":");

      module.exports.sock.send(body._topic, body);

    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  settingsUpdate: {
    /**
     * Emit Settings Change
     *
     * @param error
     * @param data
     * @constructor
     */
    value: function start() {

    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  checkBackend: {
    /**
     * Check Backend ElasticSearch Server.
     *
     * @returns {*}
     */
    value: function checkBackend() {

      var _url = [ 'http://', process.env.ES_HOST || process.env.ELASTICSEARCH_HOST || 'localhost', ':', process.env.ES_PORT || process.env.ELASTICSEARCH_PORT || 9200 ].join('');

      require('request').get({ url: _url, json: true }, checkResponse);

      function checkResponse( error, res, body ) {

        if (body && body.status) {
          console.log( '- Backend ElasticSearch server appears operational.');
        } else {
          console.log( '- Backend ElasticSearch server is not responding on [%s].', _url);
        }

      }

      return this;

    },
    enumerable: true,
    configurable: false,
    writable: true
  }
});

function brokerServerStarted() {
  console.log( "- TCP proxy server started on %s:%d.", this.address().address, this.address().port);
}

function proxyServerStarted() {
  console.log( "- REST proxy server started on %s:%d.", this.address().address, this.address().port);
}

function documentChange(req, res, next) {
  // console.log( 'documentChange', req.method, req.originalUrl, req.param( 'index' ), req.param( 'type' ), req.param( 'op_type' ) );

  res.on('finish', function () {
    // console.log("The request was proxied in.." );
    // console.log( require( 'util').inspect( , { colors: true , depth:5, showHidden: false } ) );
  });

  next();

}

function administrativeRequest(req, res, next) {
  console.log('administrativeRequest', req.originalUrl);
  next();
}

function documentSearch(req, res, next) {
  console.log('indexSearch', req.originalUrl, req.param('index'), req.param('type'));
  next();
}

function bulkRequest(req, res, next) {

  next();
}

function settingsUpdate(req, res, next) {
  console.log('settingsUPdate', req.originalUrl, req.param('index'), req.param('type'));

  app.emit.settingsUpdate(null, {
    _index: req.param('index'),
    _type: req.param('type'),
    request: {
      body: req.body
    }
  });

  next();
}

function proxyResponse(proxyRes, req, res, options) {
  //console.log( 'proxyRes', req.method, req.url );

  if (req.method === 'PUT' || req.method === 'POST' || req.method === "DELETE") {
    res.set('x-vproxy-broker-version', 'v1.0');

    if (proxyRes.statusCode === 200) {

      // Only emit updates on sucesful changes.

      res.set('x-vproxy-broker-action', 'emitted');

      var data = [ ];

      proxyRes.on('data', function (chunk) {
        data.push(chunk.toString());
      });

      proxyRes.on('end', function () {

        module.exports.broadcast(null, data.join(''), {
          responseStatus: proxyRes.statusCode,
          path: ( req.path || '' ).toLowerCase(),
          method: (req.method || '').toLowerCase(),
          headers: proxyRes.headers
        });

      });

    }
  }

}

function transparentForward(req, res) {

  this.backendProxy.web(req, res, {
    target: [ 'http://', process.env.ES_HOST || process.env.ELASTICSEARCH_HOST || 'localhost', ':', process.env.ES_PORT || process.env.ELASTICSEARCH_PORT || 9200 ].join('')
  });

}
