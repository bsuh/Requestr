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
        command: 'fixjsstyle lib/requestr.js specs/requestr_test.js'
      },
      gjslint: {
        options: {
          stdout: true
        },
        // Closure tools linting.
        command: 'gjslint lib/requestr.js specs/requestr_test.js'
      }
    },
    
    // Minification.
    uglify: {
      my_target: {
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

  grunt.registerTask('default', ['shell', 'jshint', 'jasmine', 'uglify']);
};
