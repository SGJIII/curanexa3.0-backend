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

const corsOptions = {
  origin: "*", // or '*' to allow all origins
  optionsSuccessStatus: 200,
};

app.use(cors()); // <-- Use CORS middleware to allow all origins

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const storage = multer.memoryStorage(); // <-- Use memory storage
const upload = multer({ storage: storage });

app.post("/analyze", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const fileBuffer = req.file.buffer;
  const apiUrl = "https://curanexa4.uc.r.appspot.com/analyze";

  const form = new FormData();
  form.append("image", fileBuffer, {
    filename: "image.jpg", // You can provide a filename here
    contentType: "image/jpeg", // And the content type
  });

  try {
    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    // Return analysis identifier in response
    res.json(response.data);
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
    try {
      const parsedResults = JSON.parse(analysisResults);
      // Validate or transform the data here if necessary
      const formattedResults = formatData(parsedResults);
      res.json(formattedResults);
    } catch (error) {
      console.error(`Error parsing JSON: ${error}`);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(404).send("Analysis not found");
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
