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
        // Adding license to minified file.
        options: {
          banner: '/**\n'+
            ' * Reduce network requests at runtime.\n'+
            ' *\n'+
            ' * Copyright (C) 2013, Tradeshift. All Rights Reserved.\n'+
            ' *\n'+
            ' * This program is free software: you can redistribute it and/or modify\n'+
            ' * it under the terms of the GNU General Public License as published by\n'+
            ' * the Free Software Foundation, either version 3 of the License, or\n'+
            ' * (at your option) any later version.\n'+
            ' *\n'+
            ' * This program is distributed in the hope that it will be useful,\n'+
            ' * but WITHOUT ANY WARRANTY; without even the implied warranty of\n'+
            ' * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n'+
            ' * GNU General Public License for more details.\n'+
            ' * \n'+
            ' * You should have received a copy of the GNU General Public License\n'+
            ' * along with this program.  If not, see http://www.gnu.org/licenses/.\n'+
            ' *\n'+
            ' * @author: José Antonio Márquez Russo\n'+
            ' * https://github.com/Tradeshift/Requestr\n'+
            ' */\n',
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

  grunt.registerTask('default', ['shell', 'jshint', 'jasmine', 'uglify']);
};
