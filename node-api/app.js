var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
const config = {
  v1Url: process.env.API_ENDPOINT || 'https://intermx-test.apigee.net/int/v1/',
  "v2.1Url": process.env['API_ENDPOINT_V2.1'] || 'https://intermx-test.apigee.net/int/v2.1/',
  token: process.env.IMX_API_CONSUMER_KEY || '3vKtHnLbBB9wkxPXhXBQG5WIEDYTIyAO',
  "v2Url": process.env['API_ENDPOINT_V2'] || 'https://intermx-test.apigee.net/int/v2/'
};
function getReqOptions(path, req, hasBody = false) {
  let host;
  // host = req.connection.encrypted ? 'https' : 'http';
  //host = req.protocol === 'https' ? 'https' : 'http';
  //host = req.headers['x-forwarded-proto'] || host;
  //host = host + '://' + req.headers.host;
  host = 'https://' + req.headers.host;
  let options = {
    url: config.v1Url + path,
    headers: {
      'apikey': config.token,
      'origin': host,
    },
    json: true
  };
  if (req.headers['authorization']) {
    options['headers']['authorization'] = req.headers['authorization'];
  }
  if (hasBody) {
    options.body = req.body;
  }
  return options;
}

function isProduction() {
  /* Please Notice that 'production' is used as a fallback for the current build
   *  pipeline and can be removed if everything is fine after moving to docker
   */
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'delivery' ||
    process.env.NODE_ENV === 'live'
  );
}

function shouldRedirectWithHttps(schema) {
  return (
    (
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'live'
    ) && schema !== 'https')
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// catch http calls and redirect through https
app.use((req, res, next) => {
  let schema = req.headers['x-forwarded-proto'];
  /**
   * Disabled https redirection because of the new server architecture which
   * is behind a load balancer. The load balancer will talk to outside world
   * using https, the node and UI running behind the load balancer will load
   * using http, so I am hiding this by discussing with Nathan.
   *
   * Hidden on 09/01/2020 for lamar theme updates, probably this is the way to go.
   */
  /*if (shouldRedirectWithHttps(schema)) {
    res.set('x-forwarded-proto', 'https');
    res.redirect(301, ['https://', req.get('Host'), req.url].join(''));
  } else {
    next();
  }*/
  next();
});

// uncomment after placing your favicon in /dist
// app.use(favicon(path.join(__dirname, 'dist', 'images', 'favicons', 'favicon.ico')));
// app.use(favicon(path.join(__dirname, 'dist', 'images', 'favicons', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


if (isProduction()) {
  app.use(express.static(path.join(__dirname, 'dist'), { index: "index.html" }));
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}

app.get('/endpoint', function (req, res) {
  res.status(200).send({
    API_ENDPOINT: config.v1Url,
    API_ENDPOINT_V2: config.v2Url,
    "API_ENDPOINT_V2.1": config["v2.1Url"],
    "CHECK": "Success",
  });
});

app.get('/sites', function (req, res) {
  const options = getReqOptions('sites', req);
  request(options, function callback(error, response, body) {
    if (!error && response.statusCode === 200) {
      res.status(200).send({ ...body, apiKey: config.token });
    } else {
      res.status(response.statusCode).send();
    }
  });
});

app.post('/login', function (req, res) {
  const options = getReqOptions('users/login', req, true);
  request.post(options, function callback(error, response, body) {
    if (!error && response.statusCode === 200) {
      res.status(200).send({ userData: body, apiKey: config.token });
    } else {
      res.status(response.statusCode).send();
    }
  });
});

app.post('/login/getcode', function (req, res) {
  const options = getReqOptions('users/login/email', req, true);
  request.post(options, function callback(error, response, body) {
    if (!error && response.statusCode === 200) {
      res.status(200).send({ userData: body });
    } else {
      res.status(response.statusCode).send();
    }
  });
});

app.post('/login/passwordless', function (req, res) {
  const options = getReqOptions('users/login/passwordless', req, true);
  request.post(options, function callback(error, response, body) {
    if (!error && response.statusCode === 200) {
      res.status(200).send({ userData: body, apiKey: config.token });
    } else {
      res.status(response.statusCode).send();
    }
  });
});

app.post('/reset', function (req, res) {
  const options = getReqOptions('users/reset', req, true);
  request.post(options, function callback(error, response, body) {
    if (!error && response.statusCode === 200) {
      res.status(200).send(body);
    } else {
      res.status(response.statusCode).send();
    }
  });
});

app.get('*', function (req, res) {
  res.sendFile('index.html', { root: path.join(__dirname, 'dist') })
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

module.exports = app;
