const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  console.log("Form submitted:", username, password);

  res.send("تم استقبال البيانات (تعليم فقط).");
});

app.listen(3000, () => console.log("Server running on port 3000"));
