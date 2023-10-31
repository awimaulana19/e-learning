const User = require("../model/user");
const Mapel = require("../model/mapel");
const Course = require("../model/course");
const Attendance = require("../model/attendance");
const Attend = require("../model/attend");

const createAttendance = async (req, res) => {
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
};

const updateAttendance = async (req, res) => {
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
};

const deleteAttendance = async (req, res) => {
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
};

const getAttendanceById = async (req, res) => {
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
};

const getAttendById = async (req, res) => {
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
};

const createAttend = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.body.attendanceId });

    if (Array.isArray(req.body.user)) {
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
    } else {
      const status = req.body[`status${req.body.user}`];

      const existingAttend = await Attend.findOne({
        user: req.body.user,
        attendance: attendance._id,
      });

      if (existingAttend) {
        existingAttend.status_kehadiran = status;
        await existingAttend.save();
      } else {
        const attend = new Attend({
          user: req.body.user,
          status_kehadiran: status,
          attendance: attendance._id,
        });
        await attend.save();
      }
    }

    req.flash("msg", "Presensi Berhasil Di Absen");

    res.redirect("/guru/kehadiran/" + attendance.id);
  } catch (error) {
    console.log(error);
    res.status(404);
    res.render("error-404", {
      layout: "error-404",
    });
  }
};

const getAttendSiswa = async (req, res) => {
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
};

const createAttendSiswa = async (req, res) => {
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
}

module.exports = {
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendById,
  createAttend,
  getAttendSiswa,
  createAttendSiswa,
};
