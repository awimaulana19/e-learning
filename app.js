const express = require("express");
require("dotenv").config();
const router = require("./routes/web.js");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const passport = require("passport");
const { db } = require("./utils/db");
require("./utils/adminSeeder");
require("./utils/addServiceAccount");

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

app.use(cookieParser(process.env.SECRET_KEY));

app.use(
  session({
    secret: process.env.SECRET_KEY,
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
