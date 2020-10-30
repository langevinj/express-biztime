/**Invoice routes */

const express = require("express");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

//Return info on invoices
router.get("/", async function(req, res, next){ 
    try{
        const result = await db.query(
            `SELECT id, comp_code FROM invoices`);
        
        return res.json({ invoices: result.rows });
    } catch(e) {
        return next(e);
    }
});

//Returns obj on given invoice: {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
router.get("/:id", async function(req, res, next){
    try{
        const result = await db.query(
            `SELECT id, amt, paid, add_date, paid_date, comp_code, code, name, description
            FROM invoices AS i
                INNER JOIN companies AS c
                ON i.comp_code = c.code
            WHERE i.id = $1`,
            [req.params.id]);

        if(result.rows.length === 0){
            let notFoundError = new Error(`No invoice with id: ${req.params.id} found`)
            notFoundError.status = 404;
            throw notFoundError;
        }

        let data = result.rows[0]

        return res.json({invoice: 
            {id: data.id, amt: data.amt, paid: data.paid, add_date: data.add_date, paid_date: data.paid_date, company: {code: data.code, name: data.name, description: data.description}}
        });
    } catch (e) {
      return next(e);
    }
});

//Adds an invoice
router.post("/", async function(req, res, next){
    try{
        const { comp_code, amt } = req.body;

        //throw error if any other keys are passed into argument
        for(let i=0; i < Object.keys(req.body).length; i++){
            if(!["comp_code", "amt"].includes(Object.keys(req.body)[i])){
                throw new ExpressError("Not allowed", 404);
            }
        }

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]);
        
        return res.status(201).json({invoice: result.rows[0]});
    } catch(e){
        return next(e);
    }
});

//Updates an invoice, returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put("/:id", async function (req, res, next){
    try {
        if((Object.keys(req.body).length != 1 || Object.keys(req.body)[0] != 'amt')){
            throw new ExpressError("Not allowed", 400)
        }
        const result = await db.query(
            `UPDATE invoices
             SET amt=$1
             WHERE id=$2
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
             [req.body.amt, req.params.id]);
        
        if(result.rows.length === 0){
            throw new ExpressError(`Invoice with id ${req.params.id} cannot be found`, 404)
        }

        return res.json({invoice: result.rows[0]})
    } catch(e) {
        return next(e);
    }
});

//Deletes an invoice
router.delete("/:id", async function(req, res, next){
    try{
        const result = await db.query(
            `DELETE FROM invoices
             WHERE id=$1
             RETURNING id`,
             [req.params.id]);
        
        if(result.rows.length == 0){
            let notFoundError = new Error(`Invoice cannot be found`)
            notFoundError.status = 404;
            throw notFoundError;
        }

        return res.json({ status: "deleted" });
    } catch (e) {
        return next(e);
    }
});




module.exports = router;