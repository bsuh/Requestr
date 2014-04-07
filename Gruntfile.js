/* globals require */
var bwsrstk = require('./ext/browserstack/account.js');

var BROWSERSTACK_HOSTS = 'localhost,8088,0,localhost,3000,0';


/*jshint node:true*/
module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    
    // JSHint with options.
    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      all: [
        '.'
      ]
    },
    
    // Command-line tasks.
    shell: {
      fixjsstyle: {
        options: {
          stdout: true
        },
        // Closure tools styling.
        command: 'fixjsstyle --strict lib/requestr.js specs/requestr_test.js'
      },
      gjslint: {
        options: {
          stdout: true
        },
        // Closure tools linting.
        command: 'gjslint --strict lib/requestr.js specs/requestr_test.js'
      },
      // Starts the Browserstack Web Tunnel.
      browserstack_init: {
        options: {
          stdout: true
        },
        command: [
          'chmod +x ext/scripts/browserstack.sh',
          './ext/scripts/browserstack.sh ' + bwsrstk.key + ' ' + BROWSERSTACK_HOSTS
        ].join('&&')
      },
      // Takes screenshots.
      browserstack_screenshots: {
        options: {
          stdout: true
        },
        command: [
          'node ./ext/browserstack/screenshots.js'
        ].join('&&')
      }
    },
    
    // Minification.
    uglify: {
      my_target: {
        // Adding license to minified file.
        options: {
          banner: '<%= grunt.file.read("header.txt") %>',
          footer: '\n'+'\n'
        },
        files: {
          'lib/requestr.min.js': ['lib/requestr.js']
        }
      }
    },
    
    // Unit tests.
    jasmine: {
      src: 'lib/requestr.js',
      options: {
        specs: 'specs/requestr_test.js'
      }
    },
    
    // Git hooks with Grunt.
    githooks: {
      all: {
        'pre-commit': 'default'
      }
    }
  });

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-githooks');
  
  grunt.registerTask('browserstack', ['shell:browserstack_init']);
  grunt.registerTask('screenshots', ['shell:browserstack_screenshots']);

  grunt.registerTask('default', ['shell:fixjsstyle', 'shell:gjslint', 'jshint', 'jasmine', 'uglify']);
};
