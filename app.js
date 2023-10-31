const express = require("express");
const router = require("./routes/web.js");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const mongoose = require('mongoose');
const MongoDBSession = require("connect-mongodb-session")(session);
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const passport = require("passport");

const db = 'mongodb+srv://awimaulana19:Awimaulana123@cluster0.lnqkqdg.mongodb.net/e-learning?retryWrites=true&w=majority';
// const db = 'mongodb://127.0.0.1:27017/e-learning';
mongoose.connect(db);

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(expressLayouts);

app.use("/static", express.static("public"));
app.use(express.urlencoded({ extended: true }));

const store = new MongoDBSession({
  uri: db,
  collection: "sessions",
});

app.use(cookieParser("secret"));

app.use(
  session({
    secret: "inirahasiaelearning321",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      secure: "auto",
    },
  })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride("_method"));

app.use(router);

app.use((req, res) => {
  res.status(404);
  res.render("error-404", {
    layout: "error-404",
  });
});

app.listen(port, () =>
  console.log(`App listening on port http://localhost:${port}`)
);
