const mongoose = require("mongoose");

const Resource = mongoose.model("Resource", {
  nama: {
    type: String,
    required: true,
  },
  file: {
    type: String,
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }
});

module.exports = Resource;
