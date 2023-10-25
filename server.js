const express = require("express");
const app = express();
const multer = require("multer");
const { PythonShell } = require("python-shell");
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  },
});
const upload = multer({ storage: storage });

app.post("/analyze", upload.single("image"), (req, res) => {
  console.log("Received request for /analyze");
  const imagePath = req.file.path;
  console.log("Image path: ", imagePath);
  // Run the torchxrayvision model on the uploaded image
  const options = {
    scriptPath: "../curanexa3.0-torchxrayvision/scripts",
    args: [imagePath],
  };
  PythonShell.run("process_image.py", options, (err, results) => {
    if (err) {
      console.error("Error running Python script: ", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    // Send the analysis results back to the frontend
    console.log("Results: ", results);
    res.json({ results });
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
