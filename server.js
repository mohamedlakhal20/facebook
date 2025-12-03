const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/save", (req, res) => {
  const { username, message } = req.body;

  const line = `Name: ${username} | Message: ${message}\n`;

  fs.appendFileSync("data.txt", line, "utf8");

  res.send("تم حفظ البيانات بنجاح (تعليمي فقط).");
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);
