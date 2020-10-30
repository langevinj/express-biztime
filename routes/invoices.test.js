//connect to the test DB
process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async function () {
    let result = await db.query(`
    INSERT INTO
        companies (code, name, description) 
        VALUES ('tc', 'TestCompany', 'testing')
        RETURNING code, name, description`);
    testCompany = result.rows[0];
    let result2 = await db.query(`
    INSERT INTO
        invoices (comp_code, amt)
        VALUES ('tc', 300)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    testInvoice = result2.rows[0];
});

/**GET /invoices return list of invoices {invoices: [{id, comp_code}]} */
describe("GET /invoices", function() {
    test("Get a list of 1 invoice", async function() {
        const response = await request(app).get('/invoices');

        expect(response.statusCode).toEqual(200);

        expect(response.body).toEqual({ invoices: [{id: testInvoice.id, comp_code: testInvoice.comp_code}]});
    });
});

/**GET /invoices/:id get obj of given invoice: {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}*/
//need to know how to convert the date to string without changing it
describe("GET /invoices/:id", function(){
    test("Get a single invoice", async function() {
        const response = await request(app).get(`/invoices/${testInvoice.id}`)

        expect(response.statusCode).toEqual(200);
    });
});

/** Post /invoices adds an invoice and returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
describe("POST /invoices", function() {
    test("Add an invoice", async function() {
        const response = await request(app).post('/invoices')
        .send({ comp_code: `${testCompany.code}`, amt: 666 });

        expect(response.statusCode).toEqual(201);
    });

    test("Return 404 if any other keys passed in", async function(){
        const response = await request(app).post('/invoices')
            .send({ comp_code: `${testCompany.code}`, amt: 666, paid: true})
        
        expect(response.statusCode).toEqual(404)
    });
});

/** PUT updates an invoice */
describe("PUT /invoices/:id", function(){
    test("Update an invoice", async function() {
        const response = await request(app).put(`/invoices/${testInvoice.id}`)
        .send({amt: 30})

        expect(response.statusCode).toEqual(200);
    });

    test("Respond 400 if more keys are passed in", async function(){
        const response = await request(app).put(`/invoices/${testInvoice.id}`)
        .send({ amt: 30, paid: true})

        expect(response.statusCode).toEqual(400);
    });

    test("Respond 404 if no invoice found", async function() {
        const response = await request(app).put(`/invoices/9999`)
            .send({ amt: 30 })

        expect(response.statusCode).toEqual(404);
    });
});

/** DELETE /invoices/:id delete an invoice */
describe("DELETE /invoices/:id", function() {
    test("Delete an invoice", async function() {
        const response = await request(app).delete(`/invoices/${testInvoice.id}`)

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({status: "deleted"});
    });
});

afterEach(async function () {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
});

afterAll(async function () {
    await db.end();
});