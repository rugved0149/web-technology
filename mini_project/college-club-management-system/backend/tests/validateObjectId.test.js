const test = require("node:test");
const assert = require("node:assert/strict");
const validateObjectId = require("../middleware/validateObjectId");

const makeResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("valid MongoDB ObjectId values continue to the route handler", () => {
  const response = makeResponse();
  let nextCalled = false;

  validateObjectId("id")(
    { params: { id: "64f1a7b2c3d4e5f678901234" } },
    response,
    () => { nextCalled = true; },
  );

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, null);
});

test("invalid MongoDB ObjectId values return a client error", () => {
  const response = makeResponse();
  let nextCalled = false;

  validateObjectId("clubId")(
    { params: { clubId: "not-a-database-id" } },
    response,
    () => { nextCalled = true; },
  );

  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /Invalid club ID/);
});
