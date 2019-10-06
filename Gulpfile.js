'use strict';

const gulp = require('gulp');
const minify = require('gulp-minify');
const minifyejs = require('gulp-minify-ejs');
const rename = require("gulp-rename");
const uglifycss = require('gulp-uglifycss');



gulp.task('minify-js', function(done) {
  let sheet = [
    {src:'public/js/*.js', out:'deploy/public/js'}, 
    {src:'server/*.js', out:'deploy/server'}
  ]
  // place code for your default task here
  
 sheet.map(function(file){
  gulp.src(file.src)
    .pipe(minify({
      ext:{
          src:'-debug.js',
          min:'.js'
      },
      exclude: ['tasks'],
      ignoreFiles: ['-min.js']
  }))
    .pipe(gulp.dest(file.out))
   });
   done();
});
/*
HTML
*/
gulp.task('minify-html', function(done) {
  let sheet = [
  	{src:'views/pages/*.ejs',out:'./deploy', directoryname:'/views/pages', ext:'.ejs'} 
  ]
  sheet.map(function(file){
     gulp.src(file.src)
    .pipe(minifyejs())
    .pipe(rename(function(path){
      path.dirname += file.directoryname;
      path.extname = file.ext;
    }))
    .pipe(gulp.dest(file.out))
  })
  done();
});

gulp.task('minify-css', function (done) {
  gulp.src('./public/css/*.css')
    .pipe(uglifycss({
      "maxLineLen": 80,
      "uglyComments": true
    }))
    .pipe(gulp.dest('./deploy/public/css/'));

    done();
});

gulp.task('default', gulp.parallel(
  'minify-js',
  'minify-html',
  'minify-css'
));