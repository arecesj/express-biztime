const express = require('express');
const router = new express.Router();
const db = require('../db');

//Get /companies: returns list of companies in JSON
router.get('/', async function(req, res, next) {
  try {
    const results = await db.query(`SELECT code, name FROM companies`);
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

//Get /companies/:code: returns the company with the code in JSON
router.get('/:code', async function(req, res, next) {
  try {
    const companyRes = await db.query(
      `SELECT code, name, description 
         FROM companies 
         WHERE code = $1`,
      [req.params.code]
    );
    if (companyRes.rows.length === 0) {
      let err = new Error('No such company');
      err.status = 404;
      throw err;
    }
    const invoiceRes = await db.query(
      `SELECT id, amt, paid, add_date, paid_date
      FROM invoices
      WHERE comp_code = $1`,
      [req.params.code]
    );
    const company = companyRes.rows[0];
    company.invoice = invoiceRes.rows;

    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

//Post /companies: adds a company and returns JSON
router.post('/', async function(req, res, next) {
  try {
    const { code, name, description } = req.body;
    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
        VALUES ($1, $2, $3) 
        RETURNING code, name, description`,
      [code, name, description]
    );
    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// Put /companies/:code: edits existing company and returns JSON
router.put('/:code', async function(req, res, next) {
  try {
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2 
      WHERE code = $3 
      RETURNING code, name, description`,
      [name, description, req.params.code]
    );
    if (result.rows.length === 0) {
      let err = new Error('No such company');
      err.status = 404;
      throw err;
    }
    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

//Delete /companies/:code : deletes existing company and returns JSON
router.delete('/:code', async function(req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM companies 
       where code = $1
       RETURNING code`,
      [req.params.code]
    );
    if (result.rows.length === 0) {
      let err = new Error('No such company');
      err.status = 404;
      throw err;
    }
    return res.json({ message: `Deleted` });
  } catch (err) {
    return next(err);
  }
});

//export router
module.exports = router;
