var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sassMiddleware = require('node-sass-middleware');
const session = require('express-session');
const fs = require('fs');
const Mongo = require('./bin/mongo');
var im = require('imagemagick');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

var app = express();

app.use(session({
  key: null,
  name: 'session',
  token: null,
  secure: true,
  resave: false,
  sameSite: true,
  httpOnly: true,
  connect: false,
  saveUninitialized: true,
  maxAge: 60 * 60 * 1000, // 1 hour
  secret: 'it-akademy',
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminRouter);
app.use('/users', usersRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

fs.watch('uploadedFiles', function (event, filename) {
  if (event === 'rename') {

    if (fs.existsSync(__dirname + '/uploadedFiles/' + filename)) {
      setTimeout(() => {
        Mongo.getInstance().collection('flipbook').findOne({file: filename}, (err, book) => {
          if (err)
            throw err;
          if (!book || !book._id) {
            console.log('Error book not found : ' + filename);
            return;
          }
          Mongo.getInstance().collection('flipbook').updateOne({_id: book._id}, {$set: {status: 'inProgress'}}, (err, result) => {
            if (err)
              throw err ;


            let publicDir = '/books/' + filename.substr(0, filename.lastIndexOf('.'));
            let dir = __dirname + '/public' + publicDir;

            fs.mkdirSync(dir, {recursive: true, mode: 0o755});


            im.convert([__dirname + '/uploadedFiles/' + filename, dir + '/page-%d.jpg'],
              function (err, stdout) {
                if (err) throw err;
                fs.readdir(dir, function (err, files) {
                  if (err) {
                    return console.log('Unable to scan directory: ' + err);
                  }
                  var cover = '';
                  var pages = [];
                  for (var i in files) {
                    let num = files[i].replace(/^[^\d]*(\d+)[^\d]*$/, '$1')
                    if (num === '0') {
                      cover = publicDir + '/' + files[i];
                    } else {
                      pages[parseInt(num) - 1] = publicDir + '/' + files[i];
                    }
                  }
                  Mongo.getInstance().collection('flipbook').updateOne({_id: book._id}, {
                    $set: {stdout: stdout, cover: cover, pages: pages, status: 'published'}
                  });
                });
              });

          })
        })
      }, 1000)
    } else {
      let publicDir = '/books/' + filename.substr(0, filename.lastIndexOf('.'));
      let dir = __dirname + '/public/' + publicDir;
      fs.readdir(dir, function (err, files) {
        if (err) {
          return console.log('Unable to scan directory: ' + err);
        }
        for (var i in files) {
          fs.unlinkSync(dir+'/'+files[i]) ;
        }
        fs.rmdirSync(dir, {recursive:true})
      });
    }
  } else {
    console.log(event, filename);
  }
});

module.exports = app;
