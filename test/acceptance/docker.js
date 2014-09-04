/**
 *
 *
 * @type {{client/docker: {can accept messages from Docker Daemon.: 'can accept messages from Docker Daemon.'}}}
 */
module.exports = {

  before: function( done ) {


    done();

  },

  "Docker Proxy": {

    'is aware of running containers on start.': function( done ) {

      return done();

    },

    'monitors changes to containers as they start.': function( done ) {

      return done();

    },

    'monitors changes to containers as they restart.': function( done ) {

      return done();

    },

    'monitors changes to containers as they stop.': function( done ) {

      return done();

    },

    'monitors changes to containers as they die.': function( done ) {

      return done();

    }

  }

}