const Mapel = require("../model/mapel");

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.roles == "admin") {
    const user = req.user;
    res.locals.auth = user;
    return next();
  }
  res.redirect("/login");
};

const isGuru = async (req, res, next) => {
  if (req.isAuthenticated() && req.user.roles == "guru") {
    const user = req.user;
    const mapel = await Mapel.find({ guru: req.user.id });
    res.locals.auth = user;
    res.locals.mapels = mapel;
    return next();
  }
  res.redirect("/login");
};

const isSiswa = async (req, res, next) => {
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
};

module.exports = {
  isAdmin,
  isGuru,
  isSiswa,
};
