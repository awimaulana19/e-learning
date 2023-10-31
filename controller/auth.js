const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const User = require("../model/user");

passport.use(
  new LocalStrategy(function (username, password, done) {
    User.findOne({ username: username })
      .then(function (user) {
        if (!user) {
          return done(null, false, { message: "Username atau Password Salah" });
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false, { message: "Username atau Password Salah" });
        }
        if (
          user.roles != "admin" &&
          user.roles != "guru" &&
          user.roles != "siswa"
        ) {
          return done(null, false, { message: "Username atau Password Salah" });
        }
        return done(null, user);
      })
      .catch(function (err) {
        return done(err);
      });
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id)
    .then(function (user) {
      done(null, user);
    })
    .catch(function (err) {
      done(err);
    });
});

const home = (req, res) => {
  res.render("landing-page", {
    layout: "landing-page",
    title: "E-Learning",
  });
};

const login = (req, res) => {
  res.render("login", {
    layout: "login",
    title: "Login",
    msg: req.flash("error"),
  });
};

const loginAuth = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: true,
});

const loginAction = (req, res) => {
  if (req.user.roles === "admin") {
    res.redirect("/admin/dashboard");
  } else if (req.user.roles === "guru") {
    res.redirect("/guru/dashboard");
  } else if (req.user.roles === "siswa") {
    res.redirect("/siswa/dashboard");
  } else {
    res.redirect("/login");
  }
};

const logout = (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/login");
  });
};

module.exports = {
  home,
  login,
  loginAuth,
  loginAction,
  logout,
};
