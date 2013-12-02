/*jshint node:true*/
module.exports = function(grunt) {
  //
  grunt.initConfig({
    //
    pkg: grunt.file.readJSON('package.json'),
    //
    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      all: [
        '.'
      ]
    },
    //
    shell: {
      fixjsstyle: {
        options: {
          stdout: true
        },
        command: 'fixjsstyle lib/requestr.js specs/requestr_test.js'
      },
      gjslint: {
        options: {
          stdout: true
        },
        command: 'gjslint lib/requestr.js specs/requestr_test.js'
      }
    },
    uglify: {
      my_target: {
        files: {
          'lib/requestr.min.js': ['lib/requestr.js']
        }
      }
    },
    //
    jasmine: {
      src: 'lib/requestr.js',
      options: {
        specs: 'specs/requestr_test.js'
      }
    }
  });
  //
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  //
  grunt.registerTask('default', ['shell', 'jshint', 'jasmine', 'uglify']);
};
