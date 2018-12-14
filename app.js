/** BizTime express application. */

const express = require('express');

const app = express();
const companyRoutes = require('./routes/companies');
const invoiceRoutes = require('./routes/invoices');
//TODO: Refactor routes so we can have just ./routes
//HOWTODOTHIS: Idea is to have companies and invoices flow into index.js (Glenn)

app.use(express.json());
app.use('/companies', companyRoutes);
app.use('/invoices', invoiceRoutes);

/** 404 handler */

app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

// you only get here if you call next(WITH-AN-ERROR)

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});

module.exports = app;
