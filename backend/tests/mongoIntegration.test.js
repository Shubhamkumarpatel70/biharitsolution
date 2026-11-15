"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const crypto = require("crypto");

const uri = process.env.MONGODB_TEST_URI;
const suite = test;

suite("MongoDB integration: atomic checkout reservations and shared sessions", { skip: !uri ? "Set MONGODB_TEST_URI to a dedicated non-production database." : false }, async (t) => {
  const dbName = "askc_it_" + crypto.randomBytes(5).toString("hex");
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const couponCollection = db.collection("coupon_reservation_test");
  const lockCollection = db.collection("bootstrap_lock_test");
  const sessionCollection = db.collection("express_sessions_test");

  t.after(async () => {
    try { await db.dropDatabase(); } finally { await mongoose.disconnect(); }
  });

  await t.test("atomic coupon reservations never exceed the configured usage limit", async () => {
    await couponCollection.insertOne({ code: "LIMIT3", usageLimit: 3, usedCount: 0, reservedCount: 0, active: true });
    const attempts = await Promise.all(Array.from({ length: 25 }, () => couponCollection.updateOne(
      {
        code: "LIMIT3",
        active: true,
        $expr: { $lt: [{ $add: [{ $ifNull: ["$usedCount", 0] }, { $ifNull: ["$reservedCount", 0] }] }, "$usageLimit"] },
      },
      { $inc: { reservedCount: 1 } },
    )));
    const successfulReservations = attempts.filter((result) => result.modifiedCount === 1).length;
    const coupon = await couponCollection.findOne({ code: "LIMIT3" });
    assert.equal(successfulReservations, 3);
    assert.equal(coupon.reservedCount, 3);
    assert.ok(coupon.reservedCount <= coupon.usageLimit);
  });

  await t.test("initial-admin unique lock permits only one concurrent owner", async () => {
    const attempts = await Promise.allSettled(Array.from({ length: 20 }, (_, index) =>
      lockCollection.insertOne({ _id: "initial-admin", owner: "worker-" + index, createdAt: new Date() })
    ));
    assert.equal(attempts.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(await lockCollection.countDocuments({ _id: "initial-admin" }), 1);
  });

  await t.test("Mongo sessions are visible across independent store instances", async () => {
    const MongoSessionStore = require("../utils/mongoSessionStore");
    const first = new MongoSessionStore({ collection: sessionCollection, collectionName: "express_sessions_test" });
    const second = new MongoSessionStore({ collection: sessionCollection, collectionName: "express_sessions_test" });
    const value = { cookie: { maxAge: 60000 }, passport: { user: "integration-user" } };
    await new Promise((resolve, reject) => first.set("shared-session", value, (error) => error ? reject(error) : resolve()));
    const loaded = await new Promise((resolve, reject) => second.get("shared-session", (error, result) => error ? reject(error) : resolve(result)));
    assert.deepEqual(loaded, value);
    await new Promise((resolve, reject) => second.destroy("shared-session", (error) => error ? reject(error) : resolve()));
    const removed = await new Promise((resolve, reject) => first.get("shared-session", (error, result) => error ? reject(error) : resolve(result)));
    assert.equal(removed, null);
  });
});
