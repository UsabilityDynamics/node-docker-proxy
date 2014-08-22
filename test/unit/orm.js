/**
 * Test Shared Veneer.io Service APIs
 *
 *
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
 *
 */
module.exports = {

  /**
   * Prepare Request Client and Shared Validation Method(s).
   *
   */
  before: function () {

    var Waterline = this.Waterline = require('waterline');

    this.debug = require('debug')('vproxy:unit');

    this.utility = require('../../lib/common/utility');

    this.hostData = require('./fixtures/containers-detail.json');

    this.orm = new Waterline();

    this.config = {
      tableName: 'vproxy',
      connections: {
        diskAdapter: {
          adapter: 'disk'
        },
        memoryAdapter: {
          adapter: 'memory'
        }
      },
      adapters: {
        disk: require('sails-disk'),
        memory: require('sails-memory')
      },
      config: {
        filePath: '/tmp/vProxy',
        schema: false,
        interfaces: [
          "semantic",
          "queryable",
          "associations"
        ]
      }
    };

  },

  "vProxy ORM": {

    "can inititilize collection.": function (done) {

      this.timeout(10000);

      var self = this;

      this.Container = this.Waterline.Collection.extend({
        identity: 'container',
        connection: 'memoryAdapter',
        attributes: {
          ID: {
            type: 'string',
            index: true
          },
          Name: {
            type: 'string',
            required: false,
            minLength: 5,
            maxLength: 100
          },
          Config: {
            type: 'object'
          },
          Image: {
            type: 'string',
            required: false,
            minLength: 5,
            maxLength: 100
          }
        }
      });

      this.orm.loadCollection(this.Container);

      this.orm.initialize(this.config, function initializationComplete(error, _models) {

        self.models = _models && _models.collections ? _models.collections : self.models || null;

        if (error && error.message === 'Connection is already registered') {
          return done();
        }

        self.models.should.have.property('container');

        self.models.container.should.have.property('connections');
        self.models.container.should.have.property('waterline');
        self.models.container.should.have.property('adapter');
        self.models.container.should.have.property('definition');

        done();

      });

    },

    'can add multiple objects from JSON file.': function (done) {

      var debug = this.debug;

      this.models.container.createEach(this.hostData, function (error, model) {

        debug('createEach', model.map(function (data) {
          return data.Name
        }));

        done();

      });

    },

    'can find api.site1.com': function (done) {

      this.models.container.findOne().where({Domain: 'api.site1.com'}).exec(function (error, result) {

        result.should.have.property('ID');

        done();

      });

    },

    'can find www.site2.com': function (done) {

      this.models.container.findOne().where({Domain: 'www.site2.com'}).exec(function (error, result) {

        result.should.have.property('ID');

        done();

      });

    },

    'can NOT find www.site100.com': function (done) {

      this.models.container.findOne().where({Domain: 'www.site100.com'}).exec(function (error, result) {

        (error === null).should.be.true;
        (result === undefined).should.be.true;

        done();

      });

    }

  }

};