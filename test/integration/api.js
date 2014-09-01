/**
 * Test Shared Docker.io Service APIs
 *
 */
module.exports = {

  /**
   * Prepare Request Client and Shared Validation Method(s).
   *
   */
  before: function() {

    this.request = require( 'request' ).defaults({
      json: true
    });

    this.hasHeaders = function hasHeaders( done ) {

      return function validateResponse( error, res, body ) {
        body.should.have.properties( 'ok', 'message' );
        res.headers.should.have.properties( 'x-server', 'x-powered-by', 'x-status' );
        res.headers[ 'x-server' ].should.equal( 'docker-proxy/v2' );
        res.headers[ 'x-powered-by' ].should.equal( 'docker-proxy' );
        done();
      }

    }

  }

};