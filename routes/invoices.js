const express = require('express');
const router = new express.Router();
const db = require('../db');
const date = require('date-and-time');

//Get /invoices: returns all invoices in JSON
router.get('/', async function(req, res, next) {
  try {
    const results = await db.query(
      `SELECT id, comp_code
      FROM invoices`
    );

    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

//Get /invoices/:id : return one invoice in JSON
router.get('/:id', async function(req, res, next) {
  try {
    const invoiceRes = await db.query(
      `SELECT id, comp_code, amt, paid, add_date, paid_date
      FROM invoices
      WHERE id = $1`,
      [req.params.id]
    );

    if (invoiceRes.rows.length === 0) {
      throw new Error('No such invoice exists.');
    }

    const companyRes = await db.query(
      `SELECT code, name, description
      FROM companies
      WHERE code = $1`,
      [invoiceRes.rows[0].comp_code]
    );

    const invoice = invoiceRes.rows[0];
    invoice.company = companyRes.rows[0];

    return res.json({ invoice });
  } catch (err) {
    return next(err);
  }
});

//POST /invoices : adds an invoice and returns JSON
router.post('/', async function(req, res, next) {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    return res.json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

//PUT /invoices/:id : updates an invoice and returns JSON
// router.put('/:id', async function(req, res, next) {
//   try {
//     const { amt } = req.body;
//     const result = await db.query(
//       `UPDATE invoices SET amt = $1
//       WHERE id = $2
//       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
//       [amt, req.params.id]
//     );
//     if (result.rows.length === 0) {
//       throw new Error("Invoice doesn't exist");
//     }

//     return res.json({ invoice: result.rows[0] });
//   } catch (err) {
//     return next(err);
//   }
// });

//DELETE /invoices/:id : deletes an invoice and returns a message
router.delete('/:id', async function(req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM invoices
      WHERE id = $1
      RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      throw new Error('Invoice does not exist');
    }

    return res.json({ message: `Deleted invoice # ${result.rows[0].id}` });
  } catch (err) {
    return next(err);
  }
});

//FURTHER STUDY
//PUT /invoices/:id : allows a customer to update and pay invoice via API
router.put('/:id', async function(req, res, next) {
  try {
    const existing_invoice = await db.query(
      `SELECT paid FROM invoices WHERE id = $1`,
      [req.params.id]
    );
    //console.log(existing_invoice.rows[0].paid);

    let invoicePaid = existing_invoice.rows[0].paid;
    let { amt, paid } = req.body;
    let paid_date;

    if (invoicePaid && !paid) {
      paid_date = null;
      console.log(`Here's the paid_date ${paid_date}`);
    } else if (!invoicePaid && paid) {
      let now = new Date();
      paid_date = date.format(now, 'YYYY-MM-DD');

      console.log(`Here's the paid_date ${paid_date}`);
    } else {
      console.log('Nothing happens');
    }

    const result = await db.query(
      `UPDATE invoices
      SET amt = $1, paid = $2, paid_date = $3 
      WHERE id = $4
      RETURNING id, comp_code, amt, paid, add_date, paid_date
      `,
      [amt, paid, paid_date, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new Error('Invoice does not exist');
    }
    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

//Export Router
module.exports = router;
