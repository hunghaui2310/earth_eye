var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('./config/database')();
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var mainRouter = require('./routes/eartheye');
var adminIndexRouter = require('./routes/admin/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: '!@#$%^&*',
  store: new MySQLStore(mysql.info()),
  resave: false,
  saveUninitialized: true
}));

app.use('/', indexRouter);
app.use('/eartheye', mainRouter);
app.use('/admin', adminIndexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

let conn;

function handleDisconnect() {
  conn = mysql.init();

  conn.connect(function(err) {
    if(err) {
      console.log('error when connecting to db : ', err);
      setTimeout(handleDisconnect, 2000);
    }
  });

  conn.on('error', function(err) {
    console.log('db error', err);

    if(err.code === 'PROTOCAL_CONNECTION_LIST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();
module.exports = app;
