const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const mysql = require("mysql2");
const { uploadToBackup } = require("./backup_uploader"); 
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) return console.error("Error connecting to MySQL:", err);
  console.log("Connected to MySQL");
});

const subjectMapping = {
  SDLC: 65,
  "JIRA-Agile": 4,
  UNIX: 12,
  "HTTP Webservices": 1,
  RestAssured: 23,
  NOSQL: 5,
  MYSQL: 5,
  SQL1: 5,
  SQL2: 5,
  SQL3: 5,
  SQL4: 5,
  SQL5: 5,
  Python: 10,
  HTML: 64,
  HTML5: 29,
  CSS: 6,
  "Tailwind CSS": 46,
  DOM: 47,
  ReactJS: 42,
  Router: 48,
  Redux: 27,
  Webpack: 36,
  NextJS: 49,
  Cypress: 11,
  GraphQL: 13,
  MongoDB: 7,
  NodeJS: 34,
  ExpressJS: 35,
  ReactNative: 43,
  "Software Architecture": 2,
  NumPy: 54,
  Pandas: 55,
  Matplotlib: 63,
  EssentialMathForML: 56,
  SuperivisedLearningAlgorithms: 57,
  UnsupervisedLearningAlgorithms: 58,
  "ReinforcementLearning ": 62,
  NeuralNetwork: 60,
  DeepLearning: 61,
  NLP: 51,
  "Gen AI": 52,
  "ComputerVisionTechnigues(CVT)": 53,
  Docker: 67,
  "Git and GitHub": 66,
  RestApi: 68,
  Pytorch: 52,
  ML: 54,
  "Scikit Learn": 56,
  "Deep Learning": 52,
  Kubernetes: 52,
  Jenkins: 54,
  FastAPI: 56,
  AWS: 52,
  Pydantic: 52,
  MLOps: 56,
};

async function uploadVideo(filePath, auth) {
  console.log("Starting upload for:", filePath);

  try {
    const youtube = google.youtube({ version: "v3", auth });
    const fileSize = fs.statSync(filePath).size;

    const fileName = path.basename(filePath);
    const parts = fileName.split("_");

    // Extract pieces
    const classDate = parts[1];                  // "2025-11-11"
    const batchNumber = parts[2];                // "12"
    const subject = parts[4];                    // "ML"
    const batchSuffix = parts[parts.length - 1].split(".")[0]; // "_2025-09"
    const subjectId = subjectMapping[subject];

    if (!subjectId) {
      console.error("Invalid subject:", subject);
      return;
    }

    // Clean filename (remove batch suffix)
    const cleanFileName = parts.slice(0, -1).join("_") + path.extname(fileName);

    // Description for DB (remove batch suffix)
    const description = parts.slice(0, -1).join("_");

    // YouTube title (remove batch suffix and number after date)
    const titleParts = [...parts.slice(0, 2), ...parts.slice(3, -1)]; // remove batch number (parts[2])
    let youtubeTitle = titleParts.join(" ").replace(/_/g, " ");

    // Trim to 100 chars if longer
    if (youtubeTitle.length > 100) {
      youtubeTitle = youtubeTitle.substring(0, 100);
    }

    // Upload to YouTube
    console.log("Uploading to YouTube...");
    const res = await youtube.videos.insert(
      {
        part: "snippet,status",
        notifySubscribers: false,
        requestBody: {
          snippet: {
            title: youtubeTitle,
            description: description,
          },
          status: {
            privacyStatus: "unlisted",
          },
        },
        media: {
          body: fs.createReadStream(filePath),
        },
      },
      {
        onUploadProgress: (evt) => {
          const progress = (evt.bytesRead / fileSize) * 100;
          console.log(`Upload progress: ${Math.round(progress)}%`);
        },
      }
    );

    console.log("Upload complete. Video ID:", res.data.id);

    // Insert into DB
    const lastModDateTime = new Date().toISOString().slice(0, 10);
    const youtubeLink = `https://www.youtube.com/watch?v=${res.data.id}`;

    const query = `
      INSERT INTO recording (
        description, type, classdate, link, videoid, subject, filename, lastmoddatetime, new_subject_id
      ) VALUES (?, 'class', ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      description,
      classDate,
      youtubeLink,
      res.data.id,
      subject,
      cleanFileName,
      lastModDateTime,
      subjectId,
    ];

    connection.query(query, values, (err, results) => {
      if (err) return console.error("Error inserting into recording:", err);

      console.log("Inserted into recording:", results);

      // Insert into recording_batch
      const batchQuery = `
        INSERT INTO recording_batch (recording_id, batch_id)
        SELECT r.id, b.batchid
        FROM recording r
        JOIN batch b ON b.batchname LIKE ?
        WHERE r.videoid = ?
      `;
      connection.query(batchQuery, [`%${batchSuffix}%`, res.data.id], (err2, results2) => {
        if (err2) return console.error("Error inserting into recording_batch:", err2);
        console.log("Inserted into recording_batch:", results2);
      });
    });

    // Backup upload
    try {
      const backupUrl = await uploadToBackup(filePath,youtubeTitle, description, "class");
      const updateQuery = `UPDATE recording SET backup_url = ? WHERE videoid = ?`;
      connection.query(updateQuery, [backupUrl, res.data.id], (err, results) => {
        if (err) return console.error("Error updating backup_url:", err);
        console.log("Backup URL updated:", backupUrl);
      });
    } catch (backupError) {
      console.error("Backup upload failed:", backupError.message);
    }

    return res.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

module.exports = uploadVideo;
