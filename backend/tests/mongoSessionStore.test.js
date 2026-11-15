const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const MongoSessionStore = require("../utils/mongoSessionStore");

function callbackResult(run) {
  return new Promise((resolve, reject) => {
    run((error, value) => error ? reject(error) : resolve(value));
  });
}

test("MongoSessionStore persists, reads, touches and destroys sessions", async () => {
  const records = new Map();
  const indexes = [];
  const collection = {
    createIndex: async (...args) => { indexes.push(args); return "session_expiry_ttl"; },
    findOne: async (query) => {
      const record = records.get(query._id);
      if (!record || record.expiresAt <= query.expiresAt.$gt) return null;
      return record;
    },
    updateOne: async (query, update) => {
      const previous = records.get(query._id) || { _id: query._id };
      records.set(query._id, { ...previous, ...update.$set });
      return { acknowledged: true };
    },
    deleteOne: async ({ _id }) => ({ deletedCount: records.delete(_id) ? 1 : 0 }),
    deleteMany: async () => { const deletedCount = records.size; records.clear(); return { deletedCount }; },
  };
  const originalCollection = mongoose.connection.collection;
  mongoose.connection.collection = () => collection;
  try {
    const store = new MongoSessionStore({ ttlMs: 60_000 });
    const session = { cookie: { maxAge: 60_000 }, passport: { user: "user-1" } };
    await callbackResult((cb) => store.set("sid-1", session, cb));
    assert.deepEqual(await callbackResult((cb) => store.get("sid-1", cb)), session);
    await callbackResult((cb) => store.touch("sid-1", session, cb));
    assert.equal(indexes.length, 1, "TTL index should be initialized once");
    assert.deepEqual(indexes[0][0], { expiresAt: 1 });
    assert.equal(indexes[0][1].expireAfterSeconds, 0);
    await callbackResult((cb) => store.destroy("sid-1", cb));
    assert.equal(await callbackResult((cb) => store.get("sid-1", cb)), null);
    await callbackResult((cb) => store.set("sid-2", session, cb));
    await callbackResult((cb) => store.clear(cb));
    assert.equal(records.size, 0);
  } finally {
    mongoose.connection.collection = originalCollection;
  }
});

test("MongoSessionStore forwards database errors to express-session callbacks", async () => {
  const expected = new Error("database unavailable");
  const originalCollection = mongoose.connection.collection;
  mongoose.connection.collection = () => ({
    createIndex: async () => { throw expected; },
  });
  try {
    const store = new MongoSessionStore();
    await assert.rejects(callbackResult((cb) => store.get("sid-error", cb)), expected);
  } finally {
    mongoose.connection.collection = originalCollection;
  }
});
