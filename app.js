const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const { validationResult, check } = require("express-validator");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { Storage } = require("@google-cloud/storage");
const { format } = require("date-fns");
const { id } = require("date-fns/locale");
const multer = require("multer");

require("./utils/db");
const User = require("./model/user");
const Mapel = require("./model/mapel");
const Course = require("./model/course");
const Resource = require("./model/resource");
const Tugas = require("./model/tugas");
const Nilai = require("./model/nilai");
const Attendance = require("./model/attendance");
const Attend = require("./model/attend");

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(expressLayouts);

app.use("/static", express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser("secret"));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

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

const storage = new Storage({
  projectId: "project-latihan-awi",
  keyFilename: "./utils/serviceAccountKey.json",
});

const bucketName = "sman6-learning-storage";
const bucket = storage.bucket(bucketName);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

async function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const fileName = Date.now() + "_" + file.originalname;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false,
    });

    blobStream.on("error", (error) => {
      reject(error);
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
}

async function deleteFileByPublicUrl(publicUrl) {
  const fileName = publicUrl.split("/").slice(4).join("/");

  const file = bucket.file(fileName);

  const exists = await file.exists();
  if (exists[0]) {
    await file.delete();
    console.log(`File deleted: ${publicUrl}`);
  } else {
    console.log(`File not found: ${publicUrl}`);
  }
}

app.use(methodOverride("_method"));

app.get("/", (req, res) => {
  res.render("landing-page", {
    layout: "landing-page",
    title: "E-Learning",
  });
});

app.get("/login", (req, res) => {
  res.render("login", {
    layout: "login",
    title: "Login",
    msg: req.flash("error"),
  });
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (req, res) {
    if (req.user.roles === "admin") {
      res.redirect("/admin/dashboard");
    } else if (req.user.roles === "guru") {
      res.redirect("/guru/dashboard");
    } else if (req.user.roles === "siswa") {
      res.redirect("/siswa/dashboard");
    } else {
      res.redirect("/login");
    }
  }
);

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/login");
  });
});

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.roles == "admin") {
    const user = req.user;
    res.locals.auth = user;
    return next();
  }
  res.redirect("/login");
}

async function isGuru(req, res, next) {
  if (req.isAuthenticated() && req.user.roles == "guru") {
    const user = req.user;
    const mapel = await Mapel.find({ guru: req.user.id });
    res.locals.auth = user;
    res.locals.mapels = mapel;
    return next();
  }
  res.redirect("/login");
}

async function isSiswa(req, res, next) {
  if (req.isAuthenticated() && req.user.roles == "siswa") {
    const user = req.user;
    const mapel = await Mapel.find({
      kelas: req.user.kelas,
      jurusan: req.user.jurusan,
      tingkatan: req.user.tingkatan,
    });
    res.locals.auth = user;
    res.locals.mapels = mapel;
    return next();
  }
  res.redirect("/login");
}

app.get("/admin/dashboard", isAdmin, async (req, res) => {
  const siswaCount = await User.countDocuments({ roles: "siswa" });
  const guruCount = await User.countDocuments({ roles: "guru" });
  const mapelCount = await Mapel.countDocuments();

  res.render("admin/dashboard", {
    layout: "layouts/main",
    title: "Dashboard",
    siswaCount,
    guruCount,
    mapelCount,
  });
});

app.get("/admin/guru", isAdmin, async (req, res) => {
  const user = await User.find({ roles: "guru" });

  res.render("admin/guru/index", {
    layout: "layouts/main",
    title: "Guru",
    user,
    msg: req.flash("msg"),
  });
});

app.post(
  "/admin/guru",
  [
    check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
    check("username", "Username Tidak Boleh Kosong")
      .notEmpty()
      .custom(async (value) => {
        const user = await User.findOne({ username: value });
        if (user) {
          throw new Error("Username Sudah Ada");
        }
      }),
    check("email", "Email Tidak Boleh Kosong")
      .notEmpty()
      .custom(async (value) => {
        const user = await User.findOne({ email: value });
        if (user) {
          throw new Error("Email Sudah Ada");
        }
      }),
    check("jk", "Jenis Kelamin Tidak Boleh Kosong").notEmpty(),
    check("alamat", "Alamat Tidak Boleh Kosong").notEmpty(),
    check("noTelp", "Nomor Telepon Tidak Boleh Kosong").notEmpty(),
  ],
  isAdmin,
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const user = await User.find({ roles: "guru" });

      res.render("admin/guru/index", {
        layout: "layouts/main",
        title: "Guru",
        user,
        msg: req.flash("msg"),
        errors: result.array(),
      });
    } else {
      const { password } = req.body;

      const newUser = { ...req.body };

      const hashedPassword = bcrypt.hashSync(password, 10);
      newUser.password = hashedPassword;

      User.insertMany(newUser);
      req.flash("msg", "Data Guru Berhasil Ditambahkan");
      res.redirect("/admin/guru");
    }
  }
);

app.put(
  "/admin/guru",
  [
    check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
    check("username", "Username Tidak Boleh Kosong")
      .notEmpty()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ username: value });
        const guru = await User.findOne({ _id: req.body._id });

        if (user && value !== guru.username) {
          throw new Error("Username Sudah Ada");
        }
      }),
    check("email", "Email Tidak Boleh Kosong")
      .notEmpty()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        const guru = await User.findOne({ _id: req.body._id });

        if (user && value !== guru.email) {
          throw new Error("Email Sudah Ada");
        }
      }),
    check("jk", "Jenis Kelamin Tidak Boleh Kosong").notEmpty(),
    check("alamat", "Alamat Tidak Boleh Kosong").notEmpty(),
    check("noTelp", "Nomor Telepon Tidak Boleh Kosong").notEmpty(),
  ],
  isAdmin,
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const user = await User.find({ roles: "guru" });

      res.render("admin/guru/index", {
        layout: "layouts/main",
        title: "Guru",
        user,
        msg: req.flash("msg"),
        editErrors: result.array(),
      });
    } else {
      User.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            username: req.body.username,
            password: bcrypt.hashSync(req.body.password, 10),
            email: req.body.email,
            jk: req.body.jk,
            alamat: req.body.alamat,
            noTelp: req.body.noTelp,
          },
        }
      ).then((result) => {
        req.flash("msg", "Data Guru Berhasil Diedit");
        res.redirect("/admin/guru");
      });
    }
  }
);

app.delete("/admin/guru", isAdmin, async (req, res) => {
  const user = await User.findOne({ _id: req.body._id });

  Mapel.deleteMany({ guru: user._id }).then((result) => {});

  User.deleteOne({ _id: user._id }).then((result) => {
    req.flash("msg", "Data Guru Berhasil Dihapus");
    res.redirect("/admin/guru");
  });
});

app.get("/admin/mapel/:kelas", isAdmin, async (req, res) => {
  let mapel, jurusan, title;

  if (req.params.kelas == "xmia") {
    mapel = await Mapel.find({ kelas: "X", jurusan: "MIA" }).populate("guru");
    jurusan = "Mapel MIA";
    title = "Mata Pelajaran X MIA";
  } else if (req.params.kelas == "ximia") {
    mapel = await Mapel.find({ kelas: "XI", jurusan: "MIA" }).populate("guru");
    jurusan = "Mapel MIA";
    title = "Mata Pelajaran XI MIA";
  } else if (req.params.kelas == "xiimia") {
    mapel = await Mapel.find({ kelas: "XII", jurusan: "MIA" }).populate("guru");
    jurusan = "Mapel MIA";
    title = "Mata Pelajaran XII MIA";
  } else if (req.params.kelas == "xiis") {
    mapel = await Mapel.find({ kelas: "X", jurusan: "IIS" }).populate("guru");
    jurusan = "Mapel IIS";
    title = "Mata Pelajaran X IIS";
  } else if (req.params.kelas == "xiiis") {
    mapel = await Mapel.find({ kelas: "XI", jurusan: "IIS" }).populate("guru");
    jurusan = "Mapel IIS";
    title = "Mata Pelajaran XI IIS";
  } else if (req.params.kelas == "xiiiis") {
    mapel = await Mapel.find({ kelas: "XII", jurusan: "IIS" }).populate("guru");
    jurusan = "Mapel IIS";
    title = "Mata Pelajaran XII IIS";
  } else {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }

  const guru = await User.find({ roles: "guru" });

  res.render("admin/mapel/index", {
    layout: "layouts/main",
    jurusan,
    title,
    mapel,
    guru,
    msg: req.flash("msg"),
  });
});

app.post(
  "/admin/mapel",
  [
    check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
    check("guru", "Guru Tidak Boleh Kosong").notEmpty(),
    check("tingkatan", "Tingkatan Tidak Boleh Kosong").notEmpty(),
  ],
  isAdmin,
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const guru = await User.find({ roles: "guru" });

      let mapel, jurusan, title;

      if (req.body.jurusan === "MIA" && req.body.kelas === "X") {
        mapel = await Mapel.find({ kelas: "X", jurusan: "MIA" }).populate(
          "guru"
        );
        jurusan = "Mapel MIA";
        title = "Mata Pelajaran X MIA";
      } else if (req.body.jurusan === "MIA" && req.body.kelas === "XI") {
        mapel = await Mapel.find({ kelas: "XI", jurusan: "MIA" }).populate(
          "guru"
        );
        jurusan = "Mapel MIA";
        title = "Mata Pelajaran XI MIA";
      } else if (req.body.jurusan === "MIA" && req.body.kelas === "XII") {
        mapel = await Mapel.find({ kelas: "XII", jurusan: "MIA" }).populate(
          "guru"
        );
        jurusan = "Mapel MIA";
        title = "Mata Pelajaran XII MIA";
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "X") {
        mapel = await Mapel.find({ kelas: "X", jurusan: "IIS" }).populate(
          "guru"
        );
        jurusan = "Mapel IIS";
        title = "Mata Pelajaran X IIS";
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "XI") {
        mapel = await Mapel.find({ kelas: "XI", jurusan: "IIS" }).populate(
          "guru"
        );
        jurusan = "Mapel IIS";
        title = "Mata Pelajaran XI IIS";
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "XII") {
        mapel = await Mapel.find({ kelas: "XII", jurusan: "IIS" }).populate(
          "guru"
        );
        jurusan = "Mapel IIS";
        title = "Mata Pelajaran XII IIS";
      }

      res.render("admin/mapel/index", {
        layout: "layouts/main",
        jurusan,
        title,
        mapel,
        guru,
        msg: req.flash("msg"),
        errors: result.array(),
      });
    } else {
      if (req.body.tingkatan == "all") {
        for (let i = 1; i <= 4; i++) {
          const mapelData = {
            ...req.body,
            tingkatan: i.toString(),
          };
          Mapel.insertMany(mapelData);
        }
      } else {
        Mapel.insertMany(req.body);
      }
      req.flash("msg", "Data Mata Pelajaran Berhasil Ditambahkan");

      if (req.body.jurusan === "MIA" && req.body.kelas === "X") {
        res.redirect("/admin/mapel/xmia");
      } else if (req.body.jurusan === "MIA" && req.body.kelas === "XI") {
        res.redirect("/admin/mapel/ximia");
      } else if (req.body.jurusan === "MIA" && req.body.kelas === "XII") {
        res.redirect("/admin/mapel/xiimia");
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "X") {
        res.redirect("/admin/mapel/xiis");
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "XI") {
        res.redirect("/admin/mapel/xiiis");
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "XII") {
        res.redirect("/admin/mapel/xiiiis");
      }
    }
  }
);

app.put(
  "/admin/mapel",
  [
    check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
    check("guru", "Guru Tidak Boleh Kosong").notEmpty(),
  ],
  isAdmin,
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const pelajaran = await Mapel.findOne({ _id: req.body._id });
      const guru = await User.find({ roles: "guru" });

      let mapel, jurusan, title;

      if (pelajaran.jurusan === "MIA" && pelajaran.kelas === "X") {
        mapel = await Mapel.find({ kelas: "X", jurusan: "MIA" }).populate(
          "guru"
        );
        jurusan = "Mapel MIA";
        title = "Mata Pelajaran X MIA";
      } else if (pelajaran.jurusan === "MIA" && pelajaran.kelas === "XI") {
        mapel = await Mapel.find({ kelas: "XI", jurusan: "MIA" }).populate(
          "guru"
        );
        jurusan = "Mapel MIA";
        title = "Mata Pelajaran XI MIA";
      } else if (pelajaran.jurusan === "MIA" && pelajaran.kelas === "XII") {
        mapel = await Mapel.find({ kelas: "XII", jurusan: "MIA" }).populate(
          "guru"
        );
        jurusan = "Mapel MIA";
        title = "Mata Pelajaran XII MIA";
      } else if (pelajaran.jurusan === "IIS" && pelajaran.kelas === "X") {
        mapel = await Mapel.find({ kelas: "X", jurusan: "IIS" }).populate(
          "guru"
        );
        jurusan = "Mapel IIS";
        title = "Mata Pelajaran X IIS";
      } else if (pelajaran.jurusan === "IIS" && pelajaran.kelas === "XI") {
        mapel = await Mapel.find({ kelas: "XI", jurusan: "IIS" }).populate(
          "guru"
        );
        jurusan = "Mapel IIS";
        title = "Mata Pelajaran XI IIS";
      } else if (pelajaran.jurusan === "IIS" && pelajaran.kelas === "XII") {
        mapel = await Mapel.find({ kelas: "XII", jurusan: "IIS" }).populate(
          "guru"
        );
        jurusan = "Mapel IIS";
        title = "Mata Pelajaran XII IIS";
      }

      res.render("admin/mapel/index", {
        layout: "layouts/main",
        jurusan,
        title,
        mapel,
        guru,
        msg: req.flash("msg"),
        editErrors: result.array(),
      });
    } else {
      const pelajaran = await Mapel.findOne({ _id: req.body._id });

      Mapel.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            guru: req.body.guru,
          },
        }
      ).then((result) => {
        req.flash("msg", "Data Mata Pelajaran Berhasil Diedit");

        if (pelajaran.jurusan === "MIA" && pelajaran.kelas === "X") {
          res.redirect("/admin/mapel/xmia");
        } else if (pelajaran.jurusan === "MIA" && pelajaran.kelas === "XI") {
          res.redirect("/admin/mapel/ximia");
        } else if (pelajaran.jurusan === "MIA" && pelajaran.kelas === "XII") {
          res.redirect("/admin/mapel/xiimia");
        } else if (pelajaran.jurusan === "IIS" && pelajaran.kelas === "X") {
          res.redirect("/admin/mapel/xiis");
        } else if (pelajaran.jurusan === "IIS" && pelajaran.kelas === "XI") {
          res.redirect("/admin/mapel/xiiis");
        } else if (pelajaran.jurusan === "IIS" && pelajaran.kelas === "XII") {
          res.redirect("/admin/mapel/xiiiis");
        }
      });
    }
  }
);

app.delete("/admin/mapel", isAdmin, async (req, res) => {
  const pelajaran = await Mapel.findOne({ _id: req.body._id });

  Mapel.deleteOne({ _id: pelajaran._id }).then((result) => {
    req.flash("msg", "Data Mata Pelajaran Berhasil Dihapus");

    if (pelajaran.jurusan === "MIA" && pelajaran.kelas === "X") {
      res.redirect("/admin/mapel/xmia");
    } else if (pelajaran.jurusan === "MIA" && pelajaran.kelas === "XI") {
      res.redirect("/admin/mapel/ximia");
    } else if (pelajaran.jurusan === "MIA" && pelajaran.kelas === "XII") {
      res.redirect("/admin/mapel/xiimia");
    } else if (pelajaran.jurusan === "IIS" && pelajaran.kelas === "X") {
      res.redirect("/admin/mapel/xiis");
    } else if (pelajaran.jurusan === "IIS" && pelajaran.kelas === "XI") {
      res.redirect("/admin/mapel/xiiis");
    } else if (pelajaran.jurusan === "IIS" && pelajaran.kelas === "XII") {
      res.redirect("/admin/mapel/xiiiis");
    }
  });
});

app.get("/admin/siswa/:kelas", isAdmin, async (req, res) => {
  let user, jurusan, title;

  if (req.params.kelas == "xmia") {
    user = await User.find({ kelas: "X", jurusan: "MIA" });
    jurusan = "MIA";
    title = "Siswa X MIA";
  } else if (req.params.kelas == "ximia") {
    user = await User.find({ kelas: "XI", jurusan: "MIA" });
    jurusan = "MIA";
    title = "Siswa XI MIA";
  } else if (req.params.kelas == "xiimia") {
    user = await User.find({ kelas: "XII", jurusan: "MIA" });
    jurusan = "MIA";
    title = "Siswa XII MIA";
  } else if (req.params.kelas == "xiis") {
    user = await User.find({ kelas: "X", jurusan: "IIS" });
    jurusan = "IIS";
    title = "Siswa X IIS";
  } else if (req.params.kelas == "xiiis") {
    user = await User.find({ kelas: "XI", jurusan: "IIS" });
    jurusan = "IIS";
    title = "Siswa XI IIS";
  } else if (req.params.kelas == "xiiiis") {
    user = await User.find({ kelas: "XII", jurusan: "IIS" });
    jurusan = "IIS";
    title = "Siswa XII IIS";
  } else {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }

  res.render("admin/siswa/index", {
    layout: "layouts/main",
    jurusan,
    title,
    user,
    msg: req.flash("msg"),
  });
});

app.post(
  "/admin/siswa",
  [
    check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
    check("username", "Username/NIS Tidak Boleh Kosong")
      .notEmpty()
      .custom(async (value) => {
        const user = await User.findOne({ username: value });
        if (user) {
          throw new Error("NIS Sudah Ada");
        }
      }),
    check("email", "Email Tidak Boleh Kosong")
      .notEmpty()
      .custom(async (value) => {
        const user = await User.findOne({ email: value });
        if (user) {
          throw new Error("Email Sudah Ada");
        }
      }),
    check("tingkatan", "Tingkatan Tidak Boleh Kosong").notEmpty(),
  ],
  isAdmin,
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      let user, jurusan, title;

      if (req.body.jurusan === "MIA" && req.body.kelas === "X") {
        user = await User.find({ kelas: "X", jurusan: "MIA" });
        jurusan = "MIA";
        title = "Siswa X MIA";
      } else if (req.body.jurusan === "MIA" && req.body.kelas === "XI") {
        user = await User.find({ kelas: "XI", jurusan: "MIA" });
        jurusan = "MIA";
        title = "Siswa XI MIA";
      } else if (req.body.jurusan === "MIA" && req.body.kelas === "XII") {
        user = await User.find({ kelas: "XII", jurusan: "MIA" });
        jurusan = "MIA";
        title = "Siswa XII MIA";
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "X") {
        user = await User.find({ kelas: "X", jurusan: "IIS" });
        jurusan = "IIS";
        title = "Siswa X IIS";
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "XI") {
        user = await User.find({ kelas: "XI", jurusan: "IIS" });
        jurusan = "IIS";
        title = "Siswa XI IIS";
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "XII") {
        user = await User.find({ kelas: "XII", jurusan: "IIS" });
        jurusan = "IIS";
        title = "Siswa XII IIS";
      }

      res.render("admin/siswa/index", {
        layout: "layouts/main",
        jurusan,
        title,
        user,
        msg: req.flash("msg"),
        errors: result.array(),
      });
    } else {
      const { password } = req.body;

      const newUser = { ...req.body };

      const hashedPassword = bcrypt.hashSync(password, 10);
      newUser.password = hashedPassword;

      User.insertMany(newUser);
      req.flash("msg", "Data Siswa Berhasil Ditambahkan");

      if (req.body.jurusan === "MIA" && req.body.kelas === "X") {
        res.redirect("/admin/siswa/xmia");
      } else if (req.body.jurusan === "MIA" && req.body.kelas === "XI") {
        res.redirect("/admin/siswa/ximia");
      } else if (req.body.jurusan === "MIA" && req.body.kelas === "XII") {
        res.redirect("/admin/siswa/xiimia");
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "X") {
        res.redirect("/admin/siswa/xiis");
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "XI") {
        res.redirect("/admin/siswa/xiiis");
      } else if (req.body.jurusan === "IIS" && req.body.kelas === "XII") {
        res.redirect("/admin/siswa/xiiiis");
      }
    }
  }
);

app.put(
  "/admin/siswa",
  [
    check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
    check("username", "Username/NIS Tidak Boleh Kosong")
      .notEmpty()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ username: value });
        const siswa = await User.findOne({ _id: req.body._id });

        if (user && value !== siswa.username) {
          throw new Error("NIS Sudah Ada");
        }
      }),
    check("email", "Email Tidak Boleh Kosong")
      .notEmpty()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        const siswa = await User.findOne({ _id: req.body._id });

        if (user && value !== siswa.email) {
          throw new Error("Email Sudah Ada");
        }
      }),
    check("tingkatan", "Tingkatan Tidak Boleh Kosong").notEmpty(),
  ],
  isAdmin,
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const siswa = await User.findOne({ _id: req.body._id });
      let user, jurusan, title;

      if (siswa.jurusan === "MIA" && siswa.kelas === "X") {
        user = await User.find({ kelas: "X", jurusan: "MIA" });
        jurusan = "MIA";
        title = "Siswa X MIA";
      } else if (siswa.jurusan === "MIA" && siswa.kelas === "XI") {
        user = await User.find({ kelas: "XI", jurusan: "MIA" });
        jurusan = "MIA";
        title = "Siswa XI MIA";
      } else if (siswa.jurusan === "MIA" && siswa.kelas === "XII") {
        user = await User.find({ kelas: "XII", jurusan: "MIA" });
        jurusan = "MIA";
        title = "Siswa XII MIA";
      } else if (siswa.jurusan === "IIS" && siswa.kelas === "X") {
        user = await User.find({ kelas: "X", jurusan: "IIS" });
        jurusan = "IIS";
        title = "Siswa X IIS";
      } else if (siswa.jurusan === "IIS" && siswa.kelas === "XI") {
        user = await User.find({ kelas: "XI", jurusan: "IIS" });
        jurusan = "IIS";
        title = "Siswa XI IIS";
      } else if (siswa.jurusan === "IIS" && siswa.kelas === "XII") {
        user = await User.find({ kelas: "XII", jurusan: "IIS" });
        jurusan = "IIS";
        title = "Siswa XII IIS";
      }

      res.render("admin/siswa/index", {
        layout: "layouts/main",
        jurusan,
        title,
        user,
        msg: req.flash("msg"),
        editErrors: result.array(),
      });
    } else {
      const siswa = await User.findOne({ _id: req.body._id });

      User.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            username: req.body.username,
            email: req.body.email,
            tingkatan: req.body.tingkatan,
          },
        }
      ).then((result) => {
        req.flash("msg", "Data Siswa Berhasil Diedit");

        if (siswa.jurusan === "MIA" && siswa.kelas === "X") {
          res.redirect("/admin/siswa/xmia");
        } else if (siswa.jurusan === "MIA" && siswa.kelas === "XI") {
          res.redirect("/admin/siswa/ximia");
        } else if (siswa.jurusan === "MIA" && siswa.kelas === "XII") {
          res.redirect("/admin/siswa/xiimia");
        } else if (siswa.jurusan === "IIS" && siswa.kelas === "X") {
          res.redirect("/admin/siswa/xiis");
        } else if (siswa.jurusan === "IIS" && siswa.kelas === "XI") {
          res.redirect("/admin/siswa/xiiis");
        } else if (siswa.jurusan === "IIS" && siswa.kelas === "XII") {
          res.redirect("/admin/siswa/xiiiis");
        }
      });
    }
  }
);

app.delete("/admin/siswa", isAdmin, async (req, res) => {
  const siswa = await User.findOne({ _id: req.body._id });

  User.deleteOne({ _id: siswa._id }).then((result) => {
    req.flash("msg", "Data Siswa Berhasil Dihapus");

    if (siswa.jurusan === "MIA" && siswa.kelas === "X") {
      res.redirect("/admin/siswa/xmia");
    } else if (siswa.jurusan === "MIA" && siswa.kelas === "XI") {
      res.redirect("/admin/siswa/ximia");
    } else if (siswa.jurusan === "MIA" && siswa.kelas === "XII") {
      res.redirect("/admin/siswa/xiimia");
    } else if (siswa.jurusan === "IIS" && siswa.kelas === "X") {
      res.redirect("/admin/siswa/xiis");
    } else if (siswa.jurusan === "IIS" && siswa.kelas === "XI") {
      res.redirect("/admin/siswa/xiiis");
    } else if (siswa.jurusan === "IIS" && siswa.kelas === "XII") {
      res.redirect("/admin/siswa/xiiiis");
    }
  });
});

app.get("/guru/dashboard", isGuru, async (req, res) => {
  const pelajaranCount = await Mapel.countDocuments({ guru: req.user.id });

  res.render("guru/dashboard", {
    layout: "layouts/main",
    title: "Dashboard",
    pelajaranCount,
  });
});

app.get("/guru/mapel/:_id", isGuru, async (req, res) => {
  const allMapel = await Mapel.find({ guru: req.user.id });

  let mapel, title;
  let isFound = false;

  allMapel.forEach((element) => {
    if (req.params._id == element._id) {
      mapel = element;
      title = element.nama;
      isFound = true;
    }
  });

  if (!isFound) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  } else {
    const courses = await Course.find({ mapel: req.params._id })
      .populate("resources")
      .populate("attendance")
      .populate("tugas");

    res.render("guru/mapel/index", {
      layout: "layouts/main",
      title,
      mapel,
      courses,
      msg: req.flash("msg"),
    });
  }
});

app.post(
  "/guru/mapel",
  isGuru,
  upload.fields([
    { name: "file", maxCount: 100 },
    { name: "file_tugas", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const course = new Course({
        nama: req.body.nama,
        deskripsi: req.body.deskripsi,
        mapel: req.body.mapel,
        user: req.user._id,
      });
      await course.save();

      if (req.body.nama_resource) {
        const resources = [];

        for (let i = 0; i < req.files.file.length; i++) {
          let nama;
          if (req.files.file.length == 1) {
            nama = req.body.nama_resource;
          } else {
            nama = req.body.nama_resource[i];
          }
          const file = req.files.file[i];
          const publicUrl = await uploadFile(file);

          const resource = new Resource({
            nama: nama,
            file: publicUrl,
            course: course._id,
          });
          await resource.save();

          resources.push(resource._id);
        }

        course.resources = resources;
      }

      if (req.body.nama_tugas) {
        console.log(req.files.file_tugas);

        let publicUrlTugas;

        if (
          typeof req.files.file_tugas == "undefined" ||
          !req.files.file_tugas[0]
        ) {
          publicUrlTugas = "";
        } else {
          publicUrlTugas = await uploadFile(req.files.file_tugas[0]);
        }

        const tugas = new Tugas({
          nama_tugas: req.body.nama_tugas,
          tugas: req.body.tugas,
          file_tugas: publicUrlTugas,
          batas_tanggal: req.body.batas_tanggal,
          batas_jam: req.body.batas_jam,
          course: course._id,
        });
        await tugas.save();

        course.tugas = tugas._id;
      }

      if (req.body.batas_tanggalAbsensi) {
        const attendance = new Attendance({
          deskripsi: req.body.deskripsi_absensi,
          password: req.body.password_absensi,
          batas_tanggal: req.body.batas_tanggalAbsensi,
          jam_absen: req.body.jam_absen,
          batas_jam: req.body.batas_jamAbsensi,
          course: course._id,
        });
        await attendance.save();

        course.attendance = attendance._id;
      }

      await course.save();

      req.flash("msg", "Data berhasil Ditambahkan");

      res.redirect("/guru/mapel/" + req.body.mapel);
    } catch (error) {
      console.log("Error uploading file:", error);
    }
  }
);

app.delete("/guru/mapel", isGuru, async (req, res) => {
  const resources = await Resource.find({ course: req.body._id });

  console.log(resources);

  if (resources) {
    const fileLinks = resources.map((resource) => resource.file);

    for (const fileLink of fileLinks) {
      deleteFileByPublicUrl(fileLink);
    }

    Resource.deleteMany({ course: req.body._id }).then((result) => {});
  }

  const tugas = await Tugas.findOne({ course: req.body._id });

  if (tugas != null) {
    if (tugas.file_tugas != "") {
      deleteFileByPublicUrl(tugas.file_tugas);
    }

    const nilais = await Nilai.find({ tugas: tugas._id });

    if (nilais) {
      const fileLinks2 = nilais.map((nilai) => nilai.file_pengumpulan);

      for (const fileLink2 of fileLinks2) {
        deleteFileByPublicUrl(fileLink2);
      }

      Nilai.deleteMany({ tugas: tugas._id }).then((result) => {});
    }
  }

  Tugas.deleteMany({ course: req.body._id }).then((result) => {});

  const attendance = await Attendance.findOne({ course: req.body._id });

  if (attendance != null) {
    const attends = await Attend.find({ attendance: attendance._id });

    if (attends) {
      Attend.deleteMany({ attendance: attendance._id }).then((result) => {});
    }
  }

  Attendance.deleteMany({ course: req.body._id }).then((result) => {});

  const course = await Course.findOne({ _id: req.body._id });

  Course.deleteOne({ _id: req.body._id }).then((result) => {
    req.flash("msg", "Data Berhasil Dihapus");

    res.redirect("/guru/mapel/" + course.mapel);
  });
});

app.get("/guru/course/:_id", isGuru, async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params._id })
      .populate("resources")
      .populate("attendance")
      .populate("tugas");

    const mapel = await Mapel.findOne({ _id: course.mapel });

    res.render("guru/mapel/edit", {
      layout: "layouts/main",
      title: "Edit Data",
      mapel,
      course,
      msg: req.flash("msg"),
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.put("/guru/course", isGuru, async (req, res) => {
  const course = await Course.findOne({ _id: req.body.courseId });
  console.log(course.mapel);

  Course.updateOne(
    { _id: req.body.courseId },
    {
      $set: {
        nama: req.body.nama,
        deskripsi: req.body.deskripsi,
      },
    }
  ).then((result) => {
    req.flash("msg", "Pertemuan Berhasil Diedit");

    res.redirect("/guru/mapel/" + course.mapel);
  });
});

app.post("/guru/resource", isGuru, upload.single("file"), async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.body.course });

    const file = req.file;
    const publicUrl = await uploadFile(file);

    const resource = new Resource({
      nama: req.body.nama,
      file: publicUrl,
      course: req.body.course,
    });
    await resource.save();

    console.log(resource._id);

    course.resources.push(resource._id);
    await course.save();

    req.flash("msg", "Materi Berhasil Ditambah");

    res.redirect("/guru/course/" + course._id);
  } catch (error) {
    console.log("Error uploading file:", error);
  }
});

app.put("/guru/resource", isGuru, upload.single("file"), async (req, res) => {
  const resource = await Resource.findOne({ _id: req.body._id });
  let publicUrl;

  if (!req.file) {
    publicUrl = resource.file;
  } else {
    deleteFileByPublicUrl(resource.file);
    const file = req.file;
    publicUrl = await uploadFile(file);
  }

  Resource.updateOne(
    { _id: req.body._id },
    {
      $set: {
        nama: req.body.nama,
        file: publicUrl,
      },
    }
  ).then((result) => {
    req.flash("msg", "Materi Berhasil Diedit");

    res.redirect("/guru/course/" + resource.course);
  });
});

app.get("/guru/delete-resource/:_id", isGuru, async (req, res) => {
  try {
    const resource = await Resource.findOne({ _id: req.params._id });

    deleteFileByPublicUrl(resource.file);

    const course = await Course.findById(resource.course);
    course.resources = course.resources.filter(
      (resourceId) => resourceId.toString() !== req.params._id
    );
    await course.save();

    Resource.deleteOne({ _id: req.params._id }).then((result) => {
      req.flash("msg", "Materi Berhasil Dihapus");

      res.redirect("/guru/course/" + resource.course);
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.post(
  "/guru/tugas",
  isGuru,
  upload.single("file_tugas"),
  async (req, res) => {
    try {
      const course = await Course.findOne({ _id: req.body.course_id });

      let publicUrl;
      const file = req.file;

      if (!file) {
        publicUrl = "";
      } else {
        publicUrl = await uploadFile(file);
      }

      const tugas = new Tugas({
        nama_tugas: req.body.nama_tugas,
        tugas: req.body.tugas,
        file_tugas: publicUrl,
        batas_tanggal: req.body.batas_tanggal,
        batas_jam: req.body.batas_jam,
        course: req.body.course_id,
      });
      await tugas.save();

      course.tugas = tugas._id;
      await course.save();

      req.flash("msg", "Tugas Berhasil Ditambah");

      res.redirect("/guru/course/" + course._id);
    } catch (error) {
      console.log("Error uploading file:", error);
    }
  }
);

app.put(
  "/guru/tugas",
  isGuru,
  upload.single("file_tugas"),
  async (req, res) => {
    const tugas = await Tugas.findOne({ _id: req.body.tugasId });
    let publicUrl;

    if (!req.file) {
      publicUrl = tugas.file_tugas;
    } else {
      deleteFileByPublicUrl(tugas.file_tugas);
      const file = req.file;
      publicUrl = await uploadFile(file);
    }

    Tugas.updateOne(
      { _id: req.body.tugasId },
      {
        $set: {
          nama_tugas: req.body.nama_tugas,
          tugas: req.body.tugas,
          file_tugas: publicUrl,
          batas_tanggal: req.body.batas_tanggal,
          batas_jam: req.body.batas_jam,
        },
      }
    ).then((result) => {
      req.flash("msg", "Tugas Berhasil Diedit");

      res.redirect("/guru/course/" + tugas.course);
    });
  }
);

app.get("/guru/delete-tugas/:_id", isGuru, async (req, res) => {
  try {
    const nilais = await Nilai.find({ tugas: req.params._id });

    if (nilais) {
      const fileLinks = nilais.map((nilai) => nilai.file_pengumpulan);

      for (const fileLink of fileLinks) {
        deleteFileByPublicUrl(fileLink);
      }

      Nilai.deleteMany({ tugas: req.params._id }).then((result) => {});
    }

    const tugas = await Tugas.findOne({ _id: req.params._id });

    if (tugas.file_tugas != "") {
      deleteFileByPublicUrl(tugas.file_tugas);
    }

    const course = await Course.findById(tugas.course);
    course.tugas = undefined;
    await course.save();

    Tugas.deleteOne({ _id: req.params._id }).then((result) => {
      req.flash("msg", "Tugas Berhasil Dihapus");

      res.redirect("/guru/course/" + tugas.course);
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.get("/guru/tugas/:_id", isGuru, async (req, res) => {
  try {
    const tugas = await Tugas.findOne({ _id: req.params._id }).populate(
      "course"
    );

    const mapel = await Mapel.findOne({ _id: tugas.course.mapel });

    const nilai = await Nilai.find({ tugas: tugas._id });

    const user = await User.find({
      kelas: mapel.kelas,
      jurusan: mapel.jurusan,
      tingkatan: mapel.tingkatan,
    });

    res.render("guru/mapel/tugas/mahasiswa", {
      layout: "layouts/main",
      title: "Tugas Siswa",
      mapel,
      tugas,
      user,
      nilai,
      msg: req.flash("msg"),
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.get("/guru/nilai/:_id/:siswaId", isGuru, async (req, res) => {
  try {
    const tugas = await Tugas.findOne({ _id: req.params._id }).populate(
      "course"
    );

    const mapel = await Mapel.findOne({ _id: tugas.course.mapel });

    const nilai = await Nilai.findOne({
      user: req.params.siswaId,
      tugas: tugas._id,
    });

    res.render("guru/mapel/tugas/index", {
      layout: "layouts/main",
      title: "Nilai Tugas",
      mapel,
      tugas,
      nilai,
      msg: req.flash("msg"),
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.put("/guru/nilai", isGuru, async (req, res) => {
  const nilai = await Nilai.findOne({ _id: req.body.nilaiId }).populate("user");

  Nilai.updateOne(
    { _id: req.body.nilaiId },
    {
      $set: {
        penilaian: req.body.penilaian,
      },
    }
  ).then((result) => {
    req.flash("msg", "Tugas " + nilai.user.nama + " Berhasil Dinilai");

    res.redirect("/guru/tugas/" + nilai.tugas);
  });
});

app.post("/guru/kehadiran", isGuru, async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.body.id_course });

    const attendance = new Attendance({
      deskripsi: req.body.deskripsi_absensi,
      password: req.body.password_absensi,
      batas_tanggal: req.body.batas_tanggalAbsensi,
      jam_absen: req.body.jam_absen,
      batas_jam: req.body.batas_jamAbsensi,
      course: course._id,
    });
    await attendance.save();

    course.attendance = attendance._id;
    await course.save();

    req.flash("msg", "Presensi Berhasil Ditambah");

    res.redirect("/guru/course/" + course._id);
  } catch (error) {
    console.log("Error uploading file:", error);
  }
});

app.put("/guru/kehadiran", isGuru, async (req, res) => {
  const attendance = await Attendance.findOne({ _id: req.body.attendanceId });

  Attendance.updateOne(
    { _id: req.body.attendanceId },
    {
      $set: {
        deskripsi: req.body.deskripsi_absensi,
        password: req.body.password_absensi,
        batas_tanggal: req.body.batas_tanggalAbsensi,
        jam_absen: req.body.jam_absen,
        batas_jam: req.body.batas_jamAbsensi,
      },
    }
  ).then((result) => {
    req.flash("msg", "Presensi Berhasil Diedit");

    res.redirect("/guru/course/" + attendance.course);
  });
});

app.get("/guru/delete-kehadiran/:_id", isGuru, async (req, res) => {
  try {
    const attends = await Attend.find({ attendance: req.params._id });

    if (attends) {
      Attend.deleteMany({ attendance: req.params._id }).then((result) => {});
    }

    const attendance = await Attendance.findOne({ _id: req.params._id });

    const course = await Course.findById(attendance.course);
    course.attendance = undefined;
    await course.save();

    Attendance.deleteOne({ _id: req.params._id }).then((result) => {
      req.flash("msg", "Presensi Berhasil Dihapus");

      res.redirect("/guru/course/" + attendance.course);
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.get("/guru/kehadiran/:_id", isGuru, async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      _id: req.params._id,
    }).populate("course");

    const mapel = await Mapel.findOne({ _id: attendance.course.mapel });

    const user = await User.find({
      kelas: mapel.kelas,
      jurusan: mapel.jurusan,
      tingkatan: mapel.tingkatan,
    });

    const attend = await Attend.find({ attendance: attendance._id });

    res.render("guru/mapel/absen/mahasiswa", {
      layout: "layouts/main",
      title: "Kehadiran Siswa",
      mapel,
      attendance,
      user,
      attend,
      msg: req.flash("msg"),
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.get("/guru/absen/:_id", isGuru, async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      _id: req.params._id,
    }).populate("course");

    const mapel = await Mapel.findOne({ _id: attendance.course.mapel });

    const attend = await Attend.find({ attendance: attendance._id });

    const user = await User.find({
      kelas: mapel.kelas,
      jurusan: mapel.jurusan,
      tingkatan: mapel.tingkatan,
    });

    res.render("guru/mapel/absen/index", {
      layout: "layouts/main",
      title: "Absen Siswa",
      mapel,
      attendance,
      user,
      attend,
      msg: req.flash("msg"),
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.post("/guru/absen", isGuru, async (req, res) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.body.attendanceId });

    for (const user of req.body.user) {
      const status = req.body[`status${user}`];

      const existingAttend = await Attend.findOne({
        user: user,
        attendance: attendance._id,
      });

      if (existingAttend) {
        existingAttend.status_kehadiran = status;
        await existingAttend.save();
      } else {
        const attend = new Attend({
          user: user,
          status_kehadiran: status,
          attendance: attendance._id,
        });
        await attend.save();
      }
    }

    req.flash("msg", "Presensi Berhasil Di Absen");

    res.redirect("/guru/kehadiran/" + attendance.id);
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.get("/siswa/dashboard", isSiswa, async (req, res) => {
  const pelajaranCount = await Mapel.countDocuments({
    kelas: req.user.kelas,
    jurusan: req.user.jurusan,
    tingkatan: req.user.tingkatan,
  });

  res.render("siswa/dashboard", {
    layout: "layouts/main",
    title: "Dashboard",
    pelajaranCount,
  });
});

app.get("/siswa/mapel/:_id", isSiswa, async (req, res) => {
  const allMapel = await Mapel.find({
    kelas: req.user.kelas,
    jurusan: req.user.jurusan,
    tingkatan: req.user.tingkatan,
  });

  let mapel, title;
  let isFound = false;

  allMapel.forEach((element) => {
    if (req.params._id == element._id) {
      mapel = element;
      title = element.nama;
      isFound = true;
    }
  });

  if (!isFound) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  } else {
    const courses = await Course.find({ mapel: req.params._id })
      .populate("resources")
      .populate("attendance")
      .populate("tugas");

    res.render("siswa/mapel/index", {
      layout: "layouts/main",
      title,
      mapel,
      courses,
      msg: req.flash("msg"),
    });
  }
});

app.get("/siswa/tugas/:_id", isSiswa, async (req, res) => {
  try {
    const tugas = await Tugas.findOne({ _id: req.params._id }).populate(
      "course"
    );

    const mapel = await Mapel.findOne({ _id: tugas.course.mapel });

    const nilai = await Nilai.findOne({
      user: req.user._id,
      tugas: tugas._id,
    });

    res.render("siswa/mapel/tugas/index", {
      layout: "layouts/main",
      title: "Tugas",
      mapel,
      tugas,
      nilai,
      msg: req.flash("msg"),
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.post(
  "/siswa/kumpul",
  isSiswa,
  upload.single("file_pengumpulan"),
  async (req, res) => {
    try {
      const tugas = await Tugas.findOne({ _id: req.body.tugas });

      const file = req.file;
      const publicUrl = await uploadFile(file);

      const waktuPengumpulan = new Date();
      const formattedWaktuPengumpulan = format(
        waktuPengumpulan,
        "EEEE, dd MMMM yyyy, HH:mm",
        { locale: id }
      );

      if (req.body._id) {
        const nilai = await Nilai.findOne({ _id: req.body._id });
        if (nilai) {
          deleteFileByPublicUrl(nilai.file_pengumpulan);
          nilai.file_pengumpulan = publicUrl;
          nilai.waktu_pengumpulan = formattedWaktuPengumpulan;
          await nilai.save();
        }
      } else {
        const nilaiBaru = new Nilai({
          user: req.body.user,
          status_pengumpulan: "Dikumpulkan",
          waktu_pengumpulan: formattedWaktuPengumpulan,
          file_pengumpulan: publicUrl,
          tugas: req.body.tugas,
        });
        await nilaiBaru.save();
      }

      req.flash("msg", "Tugas Berhasil Dikumpulkan");

      res.redirect("/siswa/tugas/" + tugas._id);
    } catch (error) {
      console.log("Error uploading file:", error);
    }
  }
);

app.delete("/siswa/kumpul", isSiswa, async (req, res) => {
  try {
    const nilai = await Nilai.findOne({ _id: req.body._id });

    deleteFileByPublicUrl(nilai.file_pengumpulan);

    Nilai.deleteOne({ _id: req.body._id }).then((result) => {
      req.flash("msg", "Pengumpulan Berhasil Dihapus");

      res.redirect("/siswa/tugas/" + nilai.tugas);
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.get("/siswa/kehadiran/:_id", isSiswa, async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      _id: req.params._id,
    }).populate("course");

    const mapel = await Mapel.findOne({ _id: attendance.course.mapel });

    const attend = await Attend.findOne({ user: req.user._id });

    res.render("siswa/mapel/absen/index", {
      layout: "layouts/main",
      title: "Kehadiran",
      mapel,
      attendance,
      attend,
      msg: req.flash("msg"),
      msgGagal: req.flash("msg-gagal"),
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.post("/siswa/absen", isSiswa, async (req, res) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.body.attendance });

    if (req.body.password == attendance.password) {
      const attend = new Attend({
        user: req.body.user,
        status_kehadiran: req.body.status_kehadiran,
        attendance: attendance._id,
      });
      await attend.save();

      req.flash("msg", "Berhasil Absen");

      res.redirect("/siswa/kehadiran/" + attendance.id);
    } else {
      req.flash("msg-gagal", "Absen Gagal, Password Salah");

      res.redirect("/siswa/kehadiran/" + attendance.id);
    }
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
});

app.get("/siswa/profile", isSiswa, (req, res) => {
  res.render("siswa/profile/index", {
    layout: "layouts/main",
    title: "Profile",
    msg: req.flash("msg"),
    msgGagal: req.flash("msg-gagal"),
  });
});

app.put(
  "/siswa/profile",
  isSiswa,
  upload.single("foto"),
  [
    check("jk", "Jenis Kelamin Tidak Boleh Kosong").notEmpty(),
    check("username", "Username/NIS Tidak Boleh Kosong")
      .notEmpty()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ username: value });
        const siswa = await User.findOne({ _id: req.body._id });

        if (user && value !== siswa.username) {
          throw new Error("Username/NIS Sudah Ada");
        }
      }),
    check("email", "Email Tidak Boleh Kosong")
      .notEmpty()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        const siswa = await User.findOne({ _id: req.body._id });

        if (user && value !== siswa.email) {
          throw new Error("Email Sudah Ada");
        }
      }),
  ],
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.render("siswa/profile/index", {
        layout: "layouts/main",
        title: "Profile",
        msg: req.flash("msg"),
        msgGagal: req.flash("msg-gagal"),
        errors: result.array(),
      });
    } else {
      const user = await User.findOne({ _id: req.body._id });

      if (user.foto) {
        deleteFileByPublicUrl(user.foto);
      }

      let publicUrl;

      if (req.file) {
        const file = req.file;
        publicUrl = await uploadFile(file);
      }

      User.updateOne(
        { _id: req.body._id },
        {
          $set: {
            username: req.body.username,
            email: req.body.email,
            jk: req.body.jk,
            tanggalLahir: req.body.tanggalLahir,
            foto: publicUrl,
            noTelp: req.body.noTelp,
            alamat: req.body.alamat,
          },
        }
      ).then((result) => {
        req.flash("msg", "Data Berhasil Diupdate");
        res.redirect("/siswa/profile");
      });
    }
  }
);

app.put("/siswa/pass", isSiswa, async (req, res) => {
  const user = await User.findOne({ _id: req.body.user_id });

  if (bcrypt.compareSync(req.body.passwordLama, user.password)) {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    User.updateOne(
      { _id: req.body.user_id },
      {
        $set: {
          password: hashedPassword,
        },
      }
    ).then((result) => {
      req.flash("msg", "Password Berhasil Diganti");
      res.redirect("/siswa/profile");
    });    
  }else{
    req.flash("msg-gagal", "Ganti Password Gagal, Password Lama Salah");
    res.redirect("/siswa/profile");
  }
});

app.use((req, res) => {
  res.status(404);
  res.render("error-404", {
    layout: "error-404",
  });
});

app.listen(port, () =>
  console.log(`App listening on port http://localhost:${port}`)
);
