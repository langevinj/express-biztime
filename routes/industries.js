const express = require("express");
const { route } = require("../app");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

//List all industries, and show company codes for that industry
router.get("/", async function (req, res, next){
    try {
        const result = await db.query(
            `SELECT code, name FROM industries`);
        
        let industries_info = result.rows
        for (let i = 0; i < result.rows.length; i++) {
            const c_codes = await db.query(
                `SELECT company_code 
                FROM industries
                RIGHT JOIN company_industry on industries.code = company_industry.industry_code
                WHERE code='${result.rows[i].code}'`
            )
            console.log(c_codes.rows)
            industries_info[i].companies = []
            for(let x=0; x < c_codes.rows.length; x++){
                industries_info[i].companies.push(c_codes.rows[x].company_code)
            }
        }

        return res.json({industries: industries_info});
    } catch (e) {
        return next(e);
    }
});

//Add an industry
router.post("/", async function (req, res, next){
    try{
        const { code, name } = req.body;

        const result = await db.query(
            `INSERT INTO industries (code, name)
            VALUES($1, $2)
            RETURNING code, name`,
            [code, name]
        );
        return res.status(201).json(result.rows[0]);

    } catch (e) {
        return next(e);
    }
});

//Associate an industry to a company
router.post("/company", async function (req, res, next) {
    try {
        const { industry_code, company_code } = req.body;

        const result = await db.query(
            `INSERT INTO company_industry(industry_code, company_code)
            VALUES($1, $2)
            RETURNING industry_code, company_code`,
            [industry_code, company_code]
        );
        return res.status(201).json(result.rows[0])
    } catch (e) {
        return next(e);
    }
});

module.exports = router;