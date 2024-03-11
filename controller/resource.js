const Course = require("../model/course");
const Resource = require("../model/resource");

const { uploadFile, deleteFileByPublicUrl } = require("../utils/uploadFile.js");

const createResource = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.body.course });

    let publicUrl;

    if (req.body.link) {
      publicUrl = req.body.link;
    } else {
      const file = req.file;
      publicUrl = await uploadFile(file);
    }

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
};

const updateResource = async (req, res) => {
  const resource = await Resource.findOne({ _id: req.body._id });
  let publicUrl;

  if (!req.file) {
    if (req.body.link) {
      publicUrl = req.body.link;
    } else {
      publicUrl = resource.file;
    }
  } else {
    if (resource.file.startsWith("https://storage.googleapis.com")) {
      deleteFileByPublicUrl(resource.file);
    }
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
};

const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findOne({ _id: req.params._id });

    if (resource.file.startsWith("https://storage.googleapis.com")) {
      deleteFileByPublicUrl(resource.file);
    }

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
};

module.exports = {
  createResource,
  updateResource,
  deleteResource,
};
