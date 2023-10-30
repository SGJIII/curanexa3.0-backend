const cors = require("cors");
const express = require("express");
const app = express();
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const port = process.env.PORT || 3000; // <-- Use the PORT environment variable provided by Heroku
const axios = require("axios");
const FormData = require("form-data");
app.use(cors()); // <-- Use CORS middleware to allow all origins

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

app.post("/analyze", upload.single("image"), async (req, res) => {
  const imagePath = req.file.path;
  const apiUrl = "https://curanexa4.uc.r.appspot.com/analyze";

  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));

  try {
    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    // Save analysis results to file
    const analysisId = path.basename(imagePath, path.extname(imagePath));
    const analysisPath = `analyses/${analysisId}.json`;
    fs.writeFileSync(analysisPath, JSON.stringify(response.data));

    // Return analysis identifier in response
    res.json({ analysisId });
  } catch (error) {
    console.error(`Error: ${error}`);
    res.status(500).send(error.message);
  }
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
