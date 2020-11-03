var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require("gulp-rename");
var shell = require('gulp-shell');
const zip = require('gulp-zip');
var concat = require('gulp-concat');
var bower = require('bower');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var fs = require("fs");
// var insertLines = require('gulp-insert-lines');

var paths = {
    sass: ['./scss/**/*.scss'],
    src: {
        test: {
            js: './test/testConfig.js',
            confxml: './test/testConfig.xml'
        },
        prod: {
            js: './prod/prodConfig.js',
            confxml: './prod/prodConfig.xml'
        },
        qa: {
            js: './qa/qaConfig.js',
            confxml: './qa/qaConfig.xml'
        },
        dev: {
            js: './dev/devConfig.js',
            confxml: './dev/devConfig.xml'
        },
        output: './platforms/android/build/outputs/apk/android-debug.apk'
    },
    dest: {
        js: './www/js/',
        confxml: './',
        testOutput: './test/',
        prodOutput: './prod/',
        qaOutput: './qa/',
        devOutput: './dev/'
    }
};

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
    gulp.src('./scss/ionic.app.scss')
        .pipe(sass())
        .on('error', sass.logError)
        .pipe(gulp.dest('./www/css/'))
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest('./www/css/'))
        .on('end', done);
});



gulp.task('install', ['git-check'], function() {
    return bower.commands.install()
        .on('log', function(data) {
            gutil.log('bower', gutil.colors.cyan(data.id), data.message);
        });
});

gulp.task('git-check', function(done) {
    if (!sh.which('git')) {
        console.log(
            '  ' + gutil.colors.red('Git is not installed.'),
            '\n  Git, the version control system, is required to download Ionic.',
            '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
            '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
        );
        process.exit(1);
    }
    done();
});


gulp.task('test', function() {
    console.log('test');
    // Copy from ./test/testConfig.js and paste it to ./www/js/config.js
    gulp.src(paths.src.test.js)
        .pipe(rename('config.js'))
        .pipe(gulp.dest(paths.dest.js))

    // Copy from ./test/testConfig.xml and paste it to ./config.xml
    gulp.src(paths.src.test.confxml)
        .pipe(rename('config.xml'))
        .pipe(gulp.dest(paths.dest.confxml));
});


gulp.task('prod', function() {
    // Copy from ./prod/prodConfig.js and paste it to ./www/js/config.js
    gulp.src(paths.src.prod.js)
        .pipe(rename('envConfig.js'))
        .pipe(gulp.dest(paths.dest.js));

    // Copy from ./prod/prodConfig.xml and paste it to ./config.xml
    gulp.src(paths.src.prod.confxml)
        .pipe(rename('config.xml'))
        .pipe(gulp.dest(paths.dest.confxml));
});

gulp.task('qa', function() {
    // Copy from ./prod/prodConfig.js and paste it to ./www/js/config.js
    gulp.src(paths.src.qa.js)
        .pipe(rename('envConfig.js'))
        .pipe(gulp.dest(paths.dest.js));

    // Copy from ./prod/prodConfig.xml and paste it to ./config.xml
    gulp.src(paths.src.qa.confxml)
        .pipe(rename('config.xml'))
        .pipe(gulp.dest(paths.dest.confxml));
});

gulp.task('dev', function() {
    // Copy from ./dev/devConfig.js and paste it to ./www/js/config.js
    gulp.src(paths.src.dev.js)
        .pipe(rename('envConfig.js'))
        .pipe(gulp.dest(paths.dest.js));

    // Copy from ./dev/devConfig.xml and paste it to ./config.xml
    gulp.src(paths.src.dev.confxml)
        .pipe(rename('config.xml'))
        .pipe(gulp.dest(paths.dest.confxml));
});

gulp.task('updateVersion', function() {

    // Main Cofig JS
    fs.readFile('./www/js/config.js', { encoding: 'utf-8', flag: 'rs' }, function(e, confData) {
        var confStart = confData.indexOf('// From Here');
        var confEnd = confData.indexOf('// To here');
        var confJson = JSON.parse(confData.slice(confStart + 12, confEnd));
        confJson.version = (parseFloat(confJson.version) + 0.1).toFixed(2);


        // QA CONFIG
        fs.readFile(paths.src.qa.js, { encoding: 'utf-8', flag: 'rs' }, function(qaErr, qaData) {
            var qaStart = qaData.indexOf('// From Here');
            var qaEnd = qaData.indexOf('// To here');
            var qaJson = JSON.parse(qaData.slice(qaStart + 12, qaEnd));
            qaJson['version'] = confJson.version;
            qaJson.procedureServices = confJson.procedureServices;
            var qaJsonStr = JSON.stringify(qaJson).replace(/,/g, ",\n \t").replace(/{/g, "{\n\t").replace(/}/g, "\n\t}");
            var qaString = `
/****************
QA Config JS
*****************/
var config =
// From Here
${qaJsonStr}
// To here
;
console.log('this is qa config');

app.constant('appConstants', config);
      `;
            fs.writeFile('./qa/qaConfig.js', qaString, (err) => {
                if (err) throw err;
                console.log('QA is saved!');
            });
        });


        // TEST CONFIG
        fs.readFile(paths.src.test.js, { encoding: 'utf-8', flag: 'rs' }, function(testErr, testData) {
            var testStart = testData.indexOf('// From Here');
            var testEnd = testData.indexOf('// To here');
            var testJson = JSON.parse(testData.slice(testStart + 12, testEnd));
            testJson.version = confJson.version;
            testJson.procedureServices = confJson.procedureServices;
            var testJsonStr = JSON.stringify(testJson).replace(/,/g, ",\n \t").replace(/{/g, "{\n\t").replace(/}/g, "\n\t}");
            var testString = `
/****************
Test Config JS
*****************/
var config =
// From Here
${testJsonStr}
// To here
;
console.log('this is test config');

app.constant('appConstants', config);
      `;
            fs.writeFile('./test/testConfig.js', testString, (err) => {
                if (err) throw err;
                console.log('Test is saved!');
            });
        });


        // Prod Config
        fs.readFile(paths.src.prod.js, { encoding: 'utf-8', flag: 'rs' }, function(prodErr, prodData) {
            var prodStart = prodData.indexOf('// From Here');
            var prodEnd = prodData.indexOf('// To here');
            var prodJson = JSON.parse(prodData.slice(prodStart + 12, prodEnd));
            prodJson.version = confJson.version;
            prodJson.procedureServices = confJson.procedureServices;
            var prodJsonStr = JSON.stringify(prodJson).replace(/,/g, ",\n \t").replace(/{/g, "{\n\t").replace(/}/g, "\n\t}");
            var prodString = `
/****************
Prod Config JS
*****************/
var config =
// From Here
${prodJsonStr}
// To here
;
console.log('this is prod config');

app.constant('appConstants', config);
      `;
            fs.writeFile('./prod/prodConfig.js', prodString, (err) => {
                if (err) throw err;
                console.log('Prod is saved!');
            });
        });


    });
});

gulp.task('updateQa', ['updateVersion'], shell.task([
    'gulp qa'
]));

gulp.task('updateProd', ['updateVersion'], shell.task([
    'gulp prod'
]));

gulp.task('updateTest', ['updateVersion'], shell.task([
    'gulp test'
]));

gulp.task('build', shell.task([
    'ionic build android'
]));

gulp.task('buildTest', ['test', 'build'], function() {
    var date = new Date().toLocaleString();
    date = date.substring(0, date.indexOf(",") - 0);
    date = date.replace(/\//g, "-");
    gulp.src(paths.src.output)
        .pipe(rename('MarineDelivery ' + date + '.apk'))
        .pipe(zip('MarineDeliveryTest ' + date + '.zip'))
        .pipe(gulp.dest(paths.dest.testOutput));
});

gulp.task('buildProd', ['prod', 'build'], function() {
    var date = new Date().toLocaleString();
    date = date.substring(0, date.indexOf(",") - 0);
    date = date.replace(/\//g, "-");
    gulp.src(paths.src.output)
        .pipe(rename('MarineDelivery ' + date + '.apk'))
        .pipe(zip('MarineDelivery ' + date + '.zip'))
        .pipe(gulp.dest(paths.dest.prodOutput));
});

gulp.task('buildQa', ['qa', 'build'], function() {
    var date = new Date().toLocaleString();
    date = date.substring(0, date.indexOf(",") - 0);
    date = date.replace(/\//g, "-");
    gulp.src(paths.src.output)
        .pipe(rename('MarineDelivery ' + date + '.apk'))
        .pipe(zip('MarineDelivery ' + date + '.zip'))
        .pipe(gulp.dest(paths.dest.qaOutput));
});

gulp.task('buildDev', ['dev', 'build'], function() {
    var date = new Date().toLocaleString();
    date = date.substring(0, date.indexOf(",") - 0);
    date = date.replace(/\//g, "-");
    gulp.src(paths.src.output)
        .pipe(rename('MarineDelivery ' + date + '.apk'))
        .pipe(zip('MarineDelivery ' + date + '.zip'))
        .pipe(gulp.dest(paths.dest.devOutput));
});

gulp.task('backup', function() {
    // body...
    var date = new Date().toLocaleString();
    date = date.replace(/\//g, "-");
    date = date.replace(/\,/g, " ");
    date = date.replace(/\:/g, "-");
    gulp.src('./www/**/*')
        .pipe(zip('www ' + date + '.zip'))
        .pipe(gulp.dest('./backup'));
})

gulp.task('setVersion', function() {
    var config = fs.readFileSync('./prod/prodConfig.js', 'utf-8');
    // console.log(config);
    fs.unlinkSync('./prod/prodConfig2.js');
    fs.appendFileSync('./prod/prodConfig2.js', config + ';module.exports = config');
    var newConfig = require('./prod/prodConfig2.js');
    newConfig.version = (parseFloat(newConfig.version) + 0.1).toFixed(1);

    fs.writeFileSync('./prod/prodConfig.js', 'var config = ' + JSON.stringify(newConfig, null, 2), 'utf-8');

    var config = fs.readFileSync('./qa/qaConfig.js', 'utf-8');
    // console.log(config);
    fs.unlinkSync('./qa/qaConfig2.js');
    fs.appendFileSync('./qa/qaConfig2.js', config + ';module.exports = config');
    var newConfig = require('./qa/qaConfig2.js');
    newConfig.version = (parseFloat(newConfig.version) + 0.1).toFixed(1);
    fs.writeFileSync('./qa/qaConfig.js', 'var config = ' + JSON.stringify(newConfig, null, 2), 'utf-8');
    // gulp.src('./prod/prodConfig2.js')
    //     .pipe()
    //     .pipe(gulp.dest(paths.dest.prodOutput))
})

// Template Caching
var templateCache = require('gulp-angular-templatecache');

gulp.task('templatecache', function(done){
 gulp.src('./www/template/**/*.html')
 .pipe(templateCache({standalone:true}))
 .pipe(gulp.dest('./www/js'))
 .on('end', done);
});

gulp.task('watch', function() {
 gulp.watch('./www/template/**/*.html', ['templatecache'])
 gulp.watch(paths.sass, ['sass']);
});


gulp.task('Template', ['templatecache' ]);
