/**
 *
 *    Copyright 2015 streamdata.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
'use strict';

var gulp = require("gulp");
var concat = require('gulp-concat');
var sequence = require('run-sequence');
var debug = require('gulp-debug');
var uglify = require('gulp-uglifyjs');
var path = require('path');
var gulpCC = require("gulp-closurecompiler");
var jsdoc = require("gulp-jsdoc");
var shell = require('gulp-shell');
var header = require('gulp-header');
var gitRevision = require('git-revision');

var paths = gulp.config.paths;

gulp.task('minify', function (cb) {
    var libs = paths.libs;

    // Need one run to strip @license
    return gulp.src(paths.libs)
        .pipe(debug())
        .pipe(gulpCC(
            {fileName: 'libs.js'},
            {compilation_level: "WHITESPACE_ONLY"}
        ))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('obfuscate', function (cb) {

    var minifySources = [paths.libsDistFile].concat(paths.sources);
    var pkg = require('../package.json');
    var licenseText = pkg.licenseText.join("\n");
    var banner = ['/** <%= pkg.name %> - <%= pkg.description %>',
        ' * @version v<%= pkg.version %>',
        ' * rev: <%= revision %>',
        ' */',
        ''].join('\n');
    var tag = gitRevision("tag");
    var pipeline =
            gulp.src(minifySources)
                .pipe(debug())
                .pipe(gulpCC({
                        fileName: 'streamdataio.min.js'
                    },
                    {
                        compilation_level: "ADVANCED_OPTIMIZATIONS",
                        externs: 'gulp/externs/custom.js',
                        create_source_map: path.join(paths.dist, 'streamdataio.min.js.map')
                    }
                ))
                .pipe(header(banner, {pkg: pkg, licenseText: licenseText, revision: tag}))
                .pipe(gulp.dest(paths.dist))
        ;

    return pipeline;
});


gulp.task('buildScript', function (cb) {
    var sources = libsAndSources();
    var pkg = require('../package.json');
    var licenseText = pkg.licenseText.join("\n");
    var tag = gitRevision("tag");

    var banner = ['/**',
        ' * Copyrights <%= pkg.copyrights %> - <%= pkg.author %>',
        ' *',
        ' * <%= pkg.name %> - <%= pkg.description %>',
        ' * @version v<%= pkg.version %>',
        ' * rev: <%= revision %>',
        ' * @link <%= pkg.homepage %>',
        ' *',
        ' * @license <%= pkg.license %>',
        ' *',
        '<%= licenseText %>',
        ' */',
        ''].join('\n');

    var pipeline =
            gulp.src(sources)
                .pipe(debug())
                .pipe(concat('streamdataio.js'))
                .pipe(header(banner, {pkg: pkg, licenseText: licenseText, revision: tag}))
                .pipe(gulp.dest(paths.dist))
        ;
    return pipeline;

});

gulp.task('doc', function (cb) {

    var template = {
        path: "gulp/jsdoc-template",
        systemName: "Streamdata.io",
        footer: "",
        copyright: "Connect to <a href=\"http://streamdata.io/\" target=\"_blank\">streamdata.io</a> - @Copyright Motwin 2015",
        navType: "vertical",
        theme: "streamdataio",
        linenums: true,
        collapseSymbols: false,
        inverseNav: true
    };

    var pipeline =
        gulp.src(["./src/api.js", "./README.md"])
            .pipe(debug())
            .pipe(jsdoc.parser())
            .pipe(jsdoc.generator(paths.doc, template));

    return pipeline;

});


gulp.task('build', function (callback) {
    sequence('clean', 'buildScript', 'minify', 'obfuscate', 'doc', callback);
});

gulp.task('buildDev', ['watch', 'build'], function () {

});

function libsAndSources() {
    return paths.libs.concat(paths.sources);
};
