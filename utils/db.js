const mongoose = require("mongoose");

// const db = 'mongodb://127.0.0.1:27017/e-learning';
const db = process.env.DB_CONNECTION_STRING;

mongoose.connect(db);

module.exports = { db };
