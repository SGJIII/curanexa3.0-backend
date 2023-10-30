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
  const imageBuffer = req.file.buffer; // <-- Get the file buffer
  const apiUrl = "https://curanexa4.uc.r.appspot.com/analyze";

  const form = new FormData();
  form.append("image", imageBuffer, { filename: "image.jpg" }); // <-- Append the buffer as a file

  try {
    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    // Return analysis results in response
    res.json(response.data);
  } catch (error) {
    console.error(`Error: ${error}`);
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
