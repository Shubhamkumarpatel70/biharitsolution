const test = require("node:test");
const assert = require("node:assert/strict");
const MongoSessionStore = require("../utils/mongoSessionStore");

const call = (method) => new Promise((resolve, reject) => {
  method((error, value) => error ? reject(error) : resolve(value));
});

test("Mongo session store persists and removes sessions", async () => {
  const data = new Map();
  let indexCalls = 0;
  const collection = {
    createIndex: async () => { indexCalls += 1; },
    updateOne: async ({ _id }, update) => {
      data.set(_id, { session: update.$set.session, expiresAt: update.$set.expiresAt });
    },
    findOne: async ({ _id }) => data.get(_id) || null,
    deleteOne: async ({ _id }) => { data.delete(_id); },
    deleteMany: async () => { data.clear(); },
  };
  const store = new MongoSessionStore({ collection, ttlMs: 60_000 });
  const value = { cookie: { maxAge: 60_000 }, passport: { user: "test-user" } };

  await call((cb) => store.set("session-1", value, cb));
  assert.deepStrictEqual(await call((cb) => store.get("session-1", cb)), value);
  await call((cb) => store.touch("session-1", value, cb));
  assert.strictEqual(indexCalls, 1);
  await call((cb) => store.destroy("session-1", cb));
  assert.strictEqual(await call((cb) => store.get("session-1", cb)), null);
  await call((cb) => store.set("session-2", value, cb));
  await call((cb) => store.clear(cb));
  assert.strictEqual(data.size, 0);
});

test("Mongo session store reports database failures to callbacks", async () => {
  const failure = new Error("database unavailable");
  const store = new MongoSessionStore({
    collection: { createIndex: async () => { throw failure; } },
  });
  await assert.rejects(call((cb) => store.get("missing", cb)), /database unavailable/);
});
