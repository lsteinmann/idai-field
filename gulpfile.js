var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var fs = require('fs');

// compile sass and concatenate to single css file in build dir
gulp.task('convert-sass', function () {
    return gulp.src([
        'app/app.scss',
        'node_modules/leaflet/dist/leaflet.css',
        'node_modules/Leaflet.vector-markers/dist/leaflet-vector-markers.css',
        'node_modules/leaflet.pm/dist/leaflet.pm.css'
    ])
        .pipe(sass({
            includePaths: [
                'node_modules/roboto-fontface/css/roboto/sass',
                'node_modules/idai-components-2/src/scss',
                'node_modules/bootstrap/scss',
                'node_modules/mdi/scss/'
            ], precision: 8
        }))
        .pipe(concat('app.css'))
        .pipe(gulp.dest('app'));
});

gulp.task('copy-fonts-convert-sass', ['convert-sass'], function () {
    // fonts
    gulp.src([
        'node_modules/roboto-fontface/fonts/**/*',
        'node_modules/mdi/fonts/**/*'
    ])
    .pipe(gulp.dest('fonts'));
});

// Creates config files if they do not exist already
//
gulp.task('create-configs', function (callback) {

    var path = './config/Configuration.json';

    fs.access(path, fs.F_OK, function(err) {
        if (err) {
            fs.createReadStream(path + '.template').pipe(fs.createWriteStream(path));
        } else {
            console.log('Will not create ' + path + ' from template because file already exists.');
        }
    });

    var hpath = './config/Hidden.json';

    fs.access(hpath, fs.F_OK, function(err) {
        if (err) {
            fs.createReadStream(hpath + '.template').pipe(fs.createWriteStream(hpath));
        } else {
            console.log('Will not create ' + hpath + ' from template because file already exists.');
        }
    });


    var hcpath = './config/Hidden-Custom.json';

    fs.access(hcpath, fs.F_OK, function(err) {
        if (err) {
            fs.createReadStream(hcpath + '.template').pipe(fs.createWriteStream(hcpath));
        } else {
            console.log('Will not create ' + hcpath + ' from template because file already exists.');
        }
    });
});
