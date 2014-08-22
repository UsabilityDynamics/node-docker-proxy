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
    pkg: grunt.file.readJSON( 'package.json' ),

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
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
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
    },

    // Remove Dynamic/Cache Files.
    clean: {
      modules: [
        "node_modules/abstract",
        "node_modules/ghost",
        "node_modules/auto",
        "node_modules/object-*",
        "node_modules/veneer-*"
      ]
    },

    // Execute Shell Commands.
    shell: {
      install: {},
      update: {}
    },

    // Setup Symbolic Links.
    symlink: {}

  });

  // Load NPM Tasks.
  grunt.loadNpmTasks( 'grunt-markdown' );
  grunt.loadNpmTasks( 'grunt-mocha-cli' );
  grunt.loadNpmTasks( 'grunt-jscoverage' );
  grunt.loadNpmTasks( 'grunt-contrib-symlink' );
  grunt.loadNpmTasks( 'grunt-contrib-yuidoc' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-contrib-clean' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify' );
  grunt.loadNpmTasks( 'grunt-shell' );

  // Load Custom Tasks.
  grunt.loadTasks( 'lib/tasks' );

  // Build Assets
  grunt.registerTask( 'default', [  'markdown', 'yuidoc', 'mochacli' ] );

  // Install environment
  grunt.registerTask( 'install', [ 'shell:pull', 'shell:install', 'yuidoc'  ] );

  // Update Environment
  grunt.registerTask( 'update', [ 'shell:pull', 'shell:update', 'yuidoc'   ] );

  // Prepare distribution
  grunt.registerTask( 'dist', [ 'clean', 'yuidoc', 'markdown'  ] );

  // Update Documentation
  grunt.registerTask( 'doc', [ 'yuidoc', 'markdown' ] );

  // Run Tests
  grunt.registerTask( 'test', [ 'mochacli' ] );

  // Developer Mode
  grunt.registerTask( 'dev', [ 'watch' ] );

};