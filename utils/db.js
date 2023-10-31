const mongoose = require("mongoose");

const db = "mongodb+srv://awimaulana19:Awimaulana123@cluster0.lnqkqdg.mongodb.net/e-learning?retryWrites=true&w=majority";
// const db = 'mongodb://127.0.0.1:27017/e-learning';
mongoose.connect(db);

module.exports = { db };
