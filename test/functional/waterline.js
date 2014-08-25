/**
 * Test Shared Veneer.io Service APIs
 *
 */
module.exports = {

  'can init waterline': function( done ) {

    var Waterline = require('waterline');
    var dockerAdapter = require('waterline-docker');
    var diskAdapter = require('sails-disk');
    var orm = new Waterline();

    var config = {
      adapters: {
        dockerDaemon: dockerAdapter,
        disk: diskAdapter
      },
      connections: {
        dockerDaemon: {
          adapter: 'dockerDaemon',
          host: process.env.DOCKER_HOST || 'localhost:2375'
        },
        diskStore: {
          adapter: 'disk'
        }
      },
      defaults: {}
    };

    var Container = Waterline.Collection.extend({
      identity: 'container',
      connection: 'dockerDaemon',
      attributes: {
        name: {
          type: 'string',
          required: false,
          minLength: 5,
          maxLength: 100
        },
        hostname: {
          type: 'string',
          required: true,
          minLength: 5,
          maxLength: 100
        },
        path: {
          type: 'string',
          required: true,
          minLength: 0
        },
        config: {
          type: 'json'
        },
        priority: {
          type: 'integer'
        }
      },
      schema: false,
      afterCreate: function afterCreate() {
        debug( 'container', 'afterCreate' );
      }
    });

    orm.loadCollection(Container);

    orm.initialize(config, function dockerReady(err, models) {
      console.log( 'dockerReady', models );

      if(err) throw err;

      done();

    });


  }


};