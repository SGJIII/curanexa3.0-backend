const express = require("express");
const app = express();
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = file.fieldname + "-" + Date.now();
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

app.post("/analyze", upload.single("image"), (req, res) => {
  const imagePath = req.file.path;
  const scriptPath =
    "/Users/samjohnson/curanexa3.0/curanexa3.0-torchxrayvision/scripts/process_image.py";
  const command = `python ${scriptPath} ${imagePath}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(error);
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);

    // Save analysis results to file
    const analysisId = path.basename(imagePath, path.extname(imagePath));
    const analysisPath = `analyses/${analysisId}.json`;
    fs.writeFileSync(analysisPath, stdout);

    // Return analysis identifier in response
    res.json({ analysisId });
  });
});

app.get("/analysis/:analysisId", (req, res) => {
  const analysisId = req.params.analysisId;
  const analysisPath = `analyses/${analysisId}.json`;

  // Retrieve analysis results from file
  if (fs.existsSync(analysisPath)) {
    const analysisResults = fs.readFileSync(analysisPath, "utf-8");
    res.json(JSON.parse(analysisResults));
  } else {
    res.status(404).send("Analysis not found");
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
