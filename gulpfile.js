/* eslint no-undef: 0 */
require('dotenv').config();
const gulp = require('gulp');
const s3 = require('gulp-s3');
const cloudfront = require('gulp-cloudfront-invalidate');

gulp.task('s3:dev', () =>
  gulp.src('./build/**').pipe(
    s3({
      key: process.env.ACCESS_KEY,
      secret: process.env.ACCESS_SECRET,
      bucket: process.env.S3_BUCKET_DEV,
      region: process.env.S3_REGION_DEV,
    })
  )
);

gulp.task('cloudfront:dev', () =>
  gulp.src('*').pipe(
    cloudfront({
      distribution: process.env.CLOUDFRONT_DEV,
      paths: [ '/*' ],
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.ACCESS_SECRET,
    })
  )
);

gulp.task('s3:prod', () =>
  gulp.src('./build/**').pipe(
    s3({
      key: process.env.ACCESS_KEY,
      secret: process.env.ACCESS_SECRET,
      bucket: process.env.S3_BUCKET_PROD,
      region: process.env.S3_REGION_PROD,
    })
  )
);

gulp.task('cloudfront:prod', () =>
  gulp.src('*').pipe(
    cloudfront({
      distribution: process.env.CLOUDFRONT_PROD,
      paths: [ '/*' ],
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.ACCESS_SECRET,
    })
  )
);

gulp.task('deploy:dev', gulp.series('s3:dev', 'cloudfront:dev'));
gulp.task('deploy:prod', gulp.series('s3:prod', 'cloudfront:prod'));
