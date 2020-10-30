//connect to the test DB
process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function() {
    let result = await db.query(`
    INSERT INTO
        companies (code, name, description) 
        VALUES ('tc', 'TestCompany', 'testing')
        RETURNING code, name, description`);
    testCompany = result.rows[0];
});

/**GET /companies returns `{companies: {code, name}, ...} */
describe("GET /companies", function() {
    test("Gets a list of 1 company", async function() {
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toEqual(200);
        
        expect(response.body).toEqual({ companies: [{ code: testCompany.code, name: testCompany.name}]});
    });
});

/** GET /companies/:code returns {company: {code, name, description}} */
describe("GET /companies/:code", function() {
    test("Gets a single company", async function() {
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);

        expect(response.body).toEqual({ company: testCompany});
    });

    test("Respond with 404 if no company with the given code", async function() {
        const response = await request(app).get(`/companies/asdfghjkl`);
        expect(response.statusCode).toEqual(404);
    });
});

/** POST /companies returns {code, name, description} */
describe("POST /companies", function() {
    test("Adds a company to the list", async function() {
        let secondTestCompany = { code: "t2", name: "testcompany2", description: "testingagain" }
        const response = await request(app).post('/companies')
        .send({code: "t2", name:"testcompany2", description: "testingagain"});

        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual(secondTestCompany);
    });
});

/** PUT /companies/:code edits existing company, returns { company: {code, name, description}} */
describe("PUT /companies/:code", function() {
    test("Updates a company", async function() {
        const response = await request(app).put(`/companies/${testCompany.code}`)
        .send({ name: "newTestName", description: "stillTesting" });
        
        expect(response.statusCode).toEqual(200);

        expect(response.body).toEqual({ company: {code: testCompany.code, name: "newTestName", description: "stillTesting"} });
    });

    test("Reponds with 400 if code included", async function() {
        const response = await request(app).put(`/companies/${testCompany.code}`)
            .send({ code: "tc", name: "newTestName", description: "stillTesting" });

        expect(response.statusCode).toEqual(400);
    });

    test("Respond with 404 if no company with the given code", async function() {
        const response = await request(app).put(`/companies/asdfgh`)
            .send({ name: "newTestName", description: "stillTesting" });

        expect(response.statusCode).toEqual(404);
    });
});

/** DELETE /companies/:code deletes a company and returns {status: "deleted"}*/
describe("DELETE /companies/:code", function() {
    test("Deletes a company", async function(){
        const response = await request(app).delete(`/companies/${testCompany.code}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({status: "deleted"});
    });
});

afterEach(async function () {
    await db.query("DELETE FROM companies");
});

afterAll(async function () {
    await db.end();
});