/**
 * Test Shared Veneer.io Service APIs
 *
 *
 * mocha --watch test/unit/utility.js
 *
 *
 */
module.exports = {

  before: function() {

    this.dockerUtility = require( '../../lib/common/docker' );
    this.utility = require( '../../lib/common/utility' );

  },

  "Docker Proxy utility": {

  }

};