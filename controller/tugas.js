const Mapel = require("../model/mapel");
const Course = require("../model/course");
const Tugas = require("../model/tugas");
const Nilai = require("../model/nilai");
const User = require("../model/user");

const { format } = require("date-fns");
const { id } = require("date-fns/locale");
const { uploadFile, deleteFileByPublicUrl } = require("../utils/uploadFile.js");

const createTugas = async (req, res) => {
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
};

const updateTugas = async (req, res) => {
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
};

const deleteTugas = async (req, res) => {
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
};

const getTugasById = async (req, res) => {
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
};

const rekapanTugasById = async (req, res) => {
  try {
    const courses = await Course.find({ mapel: req.params._id })
      .populate("resources")
      .populate("attendance")
      .populate("tugas");

    const mapel = await Mapel.findOne({ _id: req.params._id });

    const nilai = await Nilai.find();

    const user = await User.find({
      kelas: mapel.kelas,
      jurusan: mapel.jurusan,
      tingkatan: mapel.tingkatan,
    });

    res.render("guru/mapel/rekapan/mahasiswa", {
      layout: "layouts/main",
      title: "Rekapan Tugas",
      courses,
      mapel,
      nilai,
      user,
      msg: req.flash("msg"),
    });
  } catch (error) {
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
};

const getTugasSiswa = async (req, res) => {
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
};

const createKumpulTugas = async (req, res) => {
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
};

const deleteKumpulTugas = async (req, res) => {
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
};

module.exports = {
  createTugas,
  updateTugas,
  deleteTugas,
  getTugasById,
  rekapanTugasById,
  getTugasSiswa,
  createKumpulTugas,
  deleteKumpulTugas,
};
