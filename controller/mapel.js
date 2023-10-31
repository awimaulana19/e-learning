const User = require("../model/user");
const Mapel = require("../model/mapel");
const { validationResult } = require("express-validator");

const getMapel = async (req, res) => {
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
};

const createMapel = async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const guru = await User.find({ roles: "guru" });

    let mapel, jurusan, title;

    if (req.body.jurusan === "MIA" && req.body.kelas === "X") {
      mapel = await Mapel.find({ kelas: "X", jurusan: "MIA" }).populate("guru");
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
      mapel = await Mapel.find({ kelas: "X", jurusan: "IIS" }).populate("guru");
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
};

const updateMapel = async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const pelajaran = await Mapel.findOne({ _id: req.body._id });
    const guru = await User.find({ roles: "guru" });

    let mapel, jurusan, title;

    if (pelajaran.jurusan === "MIA" && pelajaran.kelas === "X") {
      mapel = await Mapel.find({ kelas: "X", jurusan: "MIA" }).populate("guru");
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
      mapel = await Mapel.find({ kelas: "X", jurusan: "IIS" }).populate("guru");
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
};

const deleteMapel = async (req, res) => {
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
};

module.exports = {
  getMapel,
  createMapel,
  updateMapel,
  deleteMapel,
};
