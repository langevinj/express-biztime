/** Routes for companies **/

const express = require("express");
const router = new express.Router();
const slugify = require("slugify");
const db = require("../db")
const ExpressError = require("../expressError")

//Returns list of companies
router.get("/", async function (req, res, next){
    try {
        const result = await db.query(
            `SELECT code, name FROM companies`);
        
        return res.json({companies: result.rows});

    } catch (err) {
        return next(err);
    }
});

//Returns obj of a company
router.get("/:code", async function (req, res, next) {
    try {
        const code = req.params.code;

        const result = await db.query(
            `SELECT code, name, description
             FROM companies
             WHERE code='${code}'
            `
        );

        const i_codes = await db.query(
            `SELECT industry_code
            FROM companies
            RIGHT JOIN company_industry on companies.code = company_industry.company_code
            WHERE code='${code}'`
        );
        
        //Throw 404 error if company code does not exist in table
        if (result.rows.length == 0){
            let notFoundError = new Error(`There is no company with code ${code}`)
            notFoundError.status = 404;
            throw notFoundError;
        }

        let all_industry_codes = []
        for(x in i_codes.rows){
            all_industry_codes.push(i_codes.rows[x]['industry_code'])
        }

        const company_info = result.rows[0]
        company_info['industry_code'] = all_industry_codes;
        return res.json({company: company_info})

    } catch (err) {
        return next(err);
    }
});

//Adds a company
// router.post("/", async function (req, res, next){
//     try{
//         const { code, name, description } = req.body;

//         const result = await db.query(
//             `INSERT INTO companies (code, name, description)
//              VALUES ($1, $2, $3)
//              RETURNING code, name, description`,
//             [code, name, description]
//         );

//         return res.status(201).json(result.rows[0]);
//     } 
//     catch (err) {
//         return next(err);
//     }
// });

//Adds a company, uses slugify for the code, THIS ROUTE HAS NOT BEEN ADDED TO TESTS
router.post("/", async function (req, res, next) {
    try {
        const { name, description } = req.body;

        const code = slugify(name, {
            replacement: "",
            lower: true
        });

        const result = await db.query(
            `INSERT INTO companies (code, name, description)
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
            [code, name, description]
        );

        return res.status(201).json(result.rows[0]);
    }
    catch (err) {
        return next(err);
    }
});

// Edits existing company
router.put("/:code", async function (req, res, next){
    try{
        if("code" in req.body){
            throw new ExpressError("Not allowed", 400);
        }
        const { name, description } = req.body;

        const result = await db.query(
            `UPDATE companies
            SET name=$1,
                description=$2
            WHERE code = $3
            RETURNING code, name, description`,
            [name, description, req.params.code]);
        
        if(!result.rows[0]){
            throw new ExpressError(`There is no company with code ${req.params.code}`, 404);
        }
        
        return res.json({ company: result.rows[0] });

    } catch (err) {
        return next(err);
    }
});

//Deletes a company
router.delete("/:code", async function(req, res, next){
    try{
        const result = await db.query(
            `DELETE FROM companies
             WHERE code = $1
             RETURNING code`,
             [req.params.code]);

        if(result.rows.length == 0){
            let notFoundError = new Error(`No company with code ${req.params.code}`)
            notFoundError.status = 404;
            throw notFoundError
        }

        return res.json({status: "deleted"});
    } catch (err) {
        return next(err);
    }
});


module.exports = router;