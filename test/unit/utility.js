/**
 * Test Shared Veneer.io Service APIs
 *
 *
 * mocha --watch test/unit/utility.js
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
  before: function() {

    this.utility = require( '../../lib/common/utility' );

    this.hostData = require( './fixtures/containers-detail.json' );

    var Waterline = this.waterline = require('waterline');

    var orm = this.orm = new Waterline();

    var diskAdapter = this.diskAdapter = require('sails-disk');

    var config = this.config = {
      tableName: 'foobar',

      connections: {
        myLocalDisk: {
          adapter: 'disk'
        }
      },

      adapters: {
        'default': diskAdapter,
        disk: diskAdapter
      },


      config: {
        filePath: '.tmp/',
        schema: false
      }

    };


    this.models = {};

  },

  "dockerProxy utility matches domains": {

    'site1.com': function (done) {

      this.utility.findByDomain(this.hostData, 'site1.com', function (data) {
        data.should.have.property('Name', '/site1.com' );
        done();
      });

    },

    'www.site1.com': function (done) {

      this.utility.findByDomain(this.hostData, 'www.site1.com', function (data) {
        data.should.have.property('Name', '/site1.com' );
        done();
      });

    },

    'cdn.site1.com': function (done) {

      this.utility.findByDomain(this.hostData, 'cdn.site1.com', function (data) {
        data.should.have.property('Name', '/site1.com' );
        done();
      });

    }

  }

};