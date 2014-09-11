/**
 * Module Build
 *
 * @author potanin@UD
 * @version 0.0.2
 * @param grunt
 */
module.exports = function( grunt ) {

  grunt.initConfig({

    // Load Package Data.
    package: grunt.file.readJSON( 'package.json' ),

    // Run Mocha Tests.
    mochacli: {
      options: {
        require: [ 'should' ],
        reporter: 'list',
        ui: 'exports'
      },
      all: [ 'test/*.js' ]
    },

    // Generate Static YUI Documentation
    yuidoc: {
      compile: {
        name: '<%= package.name %>',
        description: '<%= package.description %>',
        version: '<%= package.version %>',
        url: '<%= package.homepage %>',
        logo: 'http://media.usabilitydynamics.com/logo.png',
        options: {
          paths: [
            "./lib",
            "./bin"
          ],
          outdir: './static/codex'
        }
      }
    },

    // Generate JS Coverage Report.
    jscoverage: {
      options: {
        inputDirectory: 'lib',
        outputDirectory: './static/lib-cov',
        highlight: true
      }
    },

    // Watch Files and Trigger Tasks.
    watch: {
      options: {
        interval: 1000,
        debounceDelay: 500
      },
      tests: {
        files: [
          'gruntfile.js',
          'bin/*.js',
          'lib/*.js',
          'test/*.js'
        ],
        tasks: [ 'test' ]
      }
    },

    // Genreate HTML Documents from Markdown Files.
    markdown: {
      all: {
        files: [ {
          expand: true,
          src: 'readme.md',
          dest: 'static/',
          ext: '.html'
        }
        ],
        options: {
          templateContext: {},
          markdownOptions: {
            gfm: true,
            codeLines: {
              before: '<span>',
              after: '</span>'
            }
          }
        }
      }
    }

  });

  // Load NPM Tasks.
  grunt.loadNpmTasks( 'grunt-markdown' );
  grunt.loadNpmTasks( 'grunt-mocha-cli' );
  grunt.loadNpmTasks( 'grunt-jscoverage' );
  grunt.loadNpmTasks( 'grunt-contrib-yuidoc' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );

  // Load Custom Tasks.
  grunt.loadTasks( 'lib/tasks' );

  // Build Assets
  grunt.registerTask( 'default', [  'markdown', 'yuidoc', 'mochacli' ] );

  // Update Documentation
  grunt.registerTask( 'doc', [ 'yuidoc', 'markdown' ] );

  // Run Tests
  grunt.registerTask( 'test', [ 'mochacli' ] );

  // Developer Mode
  grunt.registerTask( 'dev', [ 'watch' ] );

  grunt.registerTask( 'deployment', function() {
    console.log( 'fake deployment' );


  });

};