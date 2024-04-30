const User = require("../model/user");
const Mapel = require("../model/mapel");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const { uploadFile, deleteFileByPublicUrl } = require("../utils/uploadFile.js");

const dashboardAdmin = async (req, res) => {
  const siswaCount = await User.countDocuments({ roles: "siswa" });
  const guruCount = await User.countDocuments({ roles: "guru" });
  const uniqueMapelCount = await Mapel.aggregate([
    {
      $group: {
        _id: '$nama'
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 }
      }
    }
  ]);
  
  const mapelCount = (uniqueMapelCount.length > 0) ? uniqueMapelCount[0].count : 0;  

  res.render("admin/dashboard", {
    layout: "layouts/main",
    title: "Dashboard",
    siswaCount,
    guruCount,
    mapelCount,
  });
};

const dashboardGuru = async (req, res) => {
  const pelajaranCount = await Mapel.countDocuments({ guru: req.user.id });

  res.render("guru/dashboard", {
    layout: "layouts/main",
    title: "Dashboard",
    pelajaranCount,
  });
};

const dashboardSiswa = async (req, res) => {
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
};

const getGuru = async (req, res) => {
  const user = await User.find({ roles: "guru" });

  res.render("admin/guru/index", {
    layout: "layouts/main",
    title: "Guru",
    user,
    msg: req.flash("msg"),
  });
};

const createGuru = async (req, res) => {
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
};

const updateGuru = async (req, res) => {
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
};

const deleteGuru = async (req, res) => {
  const user = await User.findOne({ _id: req.body._id });

  Mapel.deleteMany({ guru: user._id }).then((result) => {});

  User.deleteOne({ _id: user._id }).then((result) => {
    req.flash("msg", "Data Guru Berhasil Dihapus");
    res.redirect("/admin/guru");
  });
};

const getSiswa = async (req, res) => {
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
};

const createSiswa = async (req, res) => {
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
};

const updateSiswa = async (req, res) => {
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
          kelas: req.body.kelas,
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
};

const deleteSiswa = async (req, res) => {
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
};

const getProfile = (req, res) => {
  res.render("siswa/profile/index", {
    layout: "layouts/main",
    title: "Profile",
    msg: req.flash("msg"),
    msgGagal: req.flash("msg-gagal"),
  });
};

const updateProfile = async (req, res) => {
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
};

const updatePassword = async (req, res) => {
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
  } else {
    req.flash("msg-gagal", "Ganti Password Gagal, Password Lama Salah");
    res.redirect("/siswa/profile");
  }
};

module.exports = {
  dashboardAdmin,
  dashboardGuru,
  dashboardSiswa,
  getGuru,
  createGuru,
  updateGuru,
  deleteGuru,
  getSiswa,
  createSiswa,
  updateSiswa,
  deleteSiswa,
  getProfile,
  updateProfile,
  updatePassword,
};
