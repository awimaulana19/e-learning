const mongoose = require("mongoose");

const Course = mongoose.model("Course", {
  nama: {
    type: String,
    required: true,
  },
  deskripsi: {
    type: String,
  },
  resources: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
    },
  ],
  tugas: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tugas',
  },
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
  },
  mapel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mapel',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
});

module.exports = Course;
