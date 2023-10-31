const Mapel = require("../model/mapel");
const Tugas = require("../model/tugas");
const Nilai = require("../model/nilai");

const getNilaiById = async (req, res) => {
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
};

const updateNilai = async (req, res) => {
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
};

module.exports = {
  getNilaiById,
  updateNilai,
};
