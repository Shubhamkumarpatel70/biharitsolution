const session = require("express-session");
const mongoose = require("mongoose");

const Store = session.Store;
const COLLECTION = "express_sessions";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Minimal MongoDB-backed express-session store. It uses the active Mongoose
 * connection and a TTL index, avoiding process-local MemoryStore sessions.
 */
class MongoSessionStore extends Store {
  constructor(options = {}) {
    super();
    this.collectionName = options.collectionName || COLLECTION;
    this.ttlMs = options.ttlMs || DEFAULT_TTL_MS;
    this.indexPromise = null;
  }

  collection() {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB is not connected; session storage is unavailable.");
    }
    return mongoose.connection.collection(this.collectionName);
  }

  ensureIndex(collection) {
    if (!this.indexPromise) {
      this.indexPromise = collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "session_expiry_ttl" },
      ).catch((error) => {
        this.indexPromise = null;
        throw error;
      });
    }
    return this.indexPromise;
  }

  get(sid, callback) {
    const collection = this.collection();
    this.ensureIndex(collection)
      .then(() => collection.findOne({ _id: sid, expiresAt: { $gt: new Date() } }))
      .then((record) => callback(null, record ? record.session : null))
      .catch(callback);
  }

  set(sid, sessionData, callback = () => {}) {
    const collection = this.collection();
    const cookieExpiry = sessionData?.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + Number(sessionData?.cookie?.maxAge || this.ttlMs));
    this.ensureIndex(collection)
      .then(() => collection.updateOne(
        { _id: sid },
        { $set: { session: sessionData, expiresAt: cookieExpiry } },
        { upsert: true },
      ))
      .then(() => callback(null))
      .catch(callback);
  }

  touch(sid, sessionData, callback = () => {}) {
    const collection = this.collection();
    const cookieExpiry = sessionData?.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + Number(sessionData?.cookie?.maxAge || this.ttlMs));
    this.ensureIndex(collection)
      .then(() => collection.updateOne(
        { _id: sid },
        { $set: { expiresAt: cookieExpiry } },
      ))
      .then(() => callback(null))
      .catch(callback);
  }

  destroy(sid, callback = () => {}) {
    this.collection().deleteOne({ _id: sid })
      .then(() => callback(null))
      .catch(callback);
  }

  clear(callback = () => {}) {
    this.collection().deleteMany({})
      .then(() => callback(null))
      .catch(callback);
  }
}

module.exports = MongoSessionStore;
