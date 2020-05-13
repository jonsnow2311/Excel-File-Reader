const fs = require("fs");
const multer = require("multer");
const express = require("express");
const mongoose = require("mongoose");
const excelToJson = require("convert-excel-to-json");
const User = require("./User");

const app = express();
app.use(express.json());

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/ExcelApp');

global.__basedir = __dirname;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/api/uploadfile", upload.single("uploadfile"), async (req, res) => {
  console.log("Inside post");
  await importExcelData2MongoDB(__basedir + "/uploads/" + req.file.filename);
  res.json({
    msg: "File uploaded/import successfully!",
    file: req.file,
  });
});

app.post("/api/addtuple", async (req, res) => {
  console.log(req.body);
  const user = new User({
    Id: req.body.Id,
    name: req.body.name,
    address: req.body.address,
    age: req.body.age
  });

  let saved_user = await user.save();

  res.send(saved_user);

});

app.delete("/api/deletetuple", async (req, res) => {

  const user = await User.findOneAndDelete({ Id: req.body.Id });
  res.send(user);

});

app.post("/api/updatetuple", async (req, res) => {

  let user = await User.findOne({ Id: req.body.Id });

  user.name = req.body.name;
  user.address = req.body.address;
  user.age = req.body.age;

  const saved_user = await user.save();
  res.send(saved_user);

});


importExcelData2MongoDB = async (filePath) => {

  const excelData = excelToJson({
    sourceFile: filePath,
    header: {
      rows: 1
    },
    columnToKey: {
      A: 'Id',
      B: 'name',
      C: 'address',
      D: 'age'
    }
  });

  console.log(excelData);

  let users = excelData.Sheet1;
  console.log(users);

  User.create(users, (err, users) => {

    console.log(users);
  });

  fs.unlinkSync(filePath);
}

app.listen(8080);
