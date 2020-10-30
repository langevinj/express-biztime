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

        expect(response.body).toEqual({id: testInvoice.id, amt: testInvoice.amt, paid: testInvoice.paid, add_date: expect.any(Object), paid_date: null, company: {code: testCompany.code, name: testCompany.name, description: testCompany.description}});
    });
});

/** Post /invoices adds an invoice and returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
describe("POST /invoices", function() {
    test("Add an invoice", async function() {
        const response = await request(app).post('/invoices')
        .send({ comp_code: `${testCompany.code}`, amt: 666 });

        expect(response.statusCode).toEqual(201);
    });
});

afterEach(async function () {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
});

afterAll(async function () {
    await db.end();
});