const Mapel = require("../model/mapel");
const Course = require("../model/course");
const Resource = require("../model/resource");
const Tugas = require("../model/tugas");
const Nilai = require("../model/nilai");
const Attendance = require("../model/attendance");
const Attend = require("../model/attend");

const { uploadFile, deleteFileByPublicUrl } = require("../utils/uploadFile.js");

const getMapelById = async (req, res) => {
  let allMapel;
  if (req.user.roles == "guru") {
    allMapel = await Mapel.find({ guru: req.user.id });
  } else if (req.user.roles == "siswa") {
    allMapel = await Mapel.find({
      kelas: req.user.kelas,
      jurusan: req.user.jurusan,
      tingkatan: req.user.tingkatan,
    });
  }

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

    if (req.user.roles == "guru") {
      res.render("guru/mapel/index", {
        layout: "layouts/main",
        title,
        mapel,
        courses,
        msg: req.flash("msg"),
      });
    } else if (req.user.roles == "siswa") {
      res.render("siswa/mapel/index", {
        layout: "layouts/main",
        title,
        mapel,
        courses,
        msg: req.flash("msg"),
      });
    }
  }
};

const createCourse = async (req, res) => {
  try {
    const course = new Course({
      nama: req.body.nama,
      deskripsi: req.body.deskripsi,
      mapel: req.body.mapel,
      user: req.user._id,
    });
    await course.save();

    if (req.body.nama_resource || req.body.nama_link) {
      const resources = [];

      if (req.body.nama_resource) {
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
      }

      if (req.body.nama_link) {
        if (Array.isArray(req.body.nama_link)) {
          for (let i = 0; i < req.body.nama_link.length; i++) {
            const nama = req.body.nama_link[i];
            const link = req.body.link[i];

            const resource = new Resource({
              nama: nama,
              file: link,
              course: course._id,
            });
            await resource.save();

            resources.push(resource._id);
          }
        } else {
          const nama = req.body.nama_link;
          const link = req.body.link;

          const resource = new Resource({
            nama: nama,
            file: link,
            course: course._id,
          });
          await resource.save();

          resources.push(resource._id);
        }
      }

      course.resources = resources;
    }

    if (req.body.nama_tugas) {
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
};

const getCourseById = async (req, res) => {
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
};

const updateCourse = async (req, res) => {
  const course = await Course.findOne({ _id: req.body.courseId });

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
};

const deleteCourse = async (req, res) => {
  const resources = await Resource.find({ course: req.body._id });

  if (resources) {
    const fileLinks = resources.map((resource) => resource.file);

    for (const fileLink of fileLinks) {
      if (fileLink.startsWith("https://storage.googleapis.com")) {
        deleteFileByPublicUrl(fileLink);
      }
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
};

module.exports = {
  getMapelById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseById,
};
