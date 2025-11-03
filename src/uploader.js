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

// Create a MySQL connection
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
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
  "NaturalLanguageProcess(NLP)": 51,
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

// ---------------------------------************Class Recordings*************----------------------------------

async function uploadVideo(filePath, auth) {
  console.log("[PRIMARY] Starting upload process for:", filePath);

  const originalFilePath = filePath;

  try {
    const youtube = google.youtube({ version: "v3", auth });
    const fileSize = fs.statSync(filePath).size;

    const fileName = path.basename(filePath);
    const parts = fileName.split("_");
    const classDate = parts[1]; 
    const batchname = parts[parts.length - 1].split(".")[0]; 

    const cleanFileName = parts.slice(0, -1).join("_") + path.extname(fileName);

    const subject = parts[4]; 
    const subjectId = subjectMapping[subject];

    if (!subjectId) {
      console.error("[PRIMARY] Invalid subject:", subject);
      return;
    }

    console.log("[PRIMARY] Uploading to primary channel...");
    const res = await youtube.videos.insert(
      {
        part: "snippet,status",
        notifySubscribers: false,
        requestBody: {
          snippet: {
            title: cleanFileName,
            description: cleanFileName,
          },
          status: {
            privacyStatus: "unlisted",
            quality: "high",
          },
        },
        media: {
          body: fs.createReadStream(filePath),
        },
      },
      {
        onUploadProgress: (evt) => {
          const progress = (evt.bytesRead / fileSize) * 100;
          console.log(`[PRIMARY] ${Math.round(progress)}% complete`);
        },
      }
    );

    console.log("[PRIMARY] Upload complete:", res.data);
    console.log("[PRIMARY] YouTube Video ID:", res.data.id);

    const videoId = res.data.id;
    const videoTitle = res.data.snippet.title;
    const lastModDateTime = new Date().toISOString().slice(0, 10);
    const youtubeLink = `https://www.youtube.com/watch?v=${videoId}`;

    const query = `
      INSERT INTO recording (
        batchname, description, type, classdate, link, videoid, subject, filename, lastmoddatetime, new_subject_id
      ) VALUES (?, ?, 'class', ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      batchname,
      videoTitle,
      classDate,
      youtubeLink,
      videoId,
      subject,
      cleanFileName,
      lastModDateTime,
      subjectId,
    ];

    // Use Promise wrapper for MySQL query to properly handle async flow
    await new Promise((resolve, reject) => {
      connection.query(query, values, async (err, results) => {
        if (err) {
          console.error("[PRIMARY] Error inserting video ID into MySQL:", err);
          reject(err);
          return;
        }

        console.log("[PRIMARY] Video ID inserted into MySQL:", results);

        // Execute the additional query to insert into recording_batch
        const additionalQuery = `
          INSERT INTO whitebox_learning.recording_batch (recording_id, batch_id)
          SELECT nr.id AS recording_id, b.batchid AS batch_id
          FROM recording nr
          JOIN batch b ON nr.batchname = b.batchname
          WHERE NOT EXISTS (
              SELECT 1
              FROM recording_batch rb
              WHERE rb.recording_id = nr.id
              AND rb.batch_id = b.batchid
          );
        `;

        connection.query(additionalQuery, (err, results) => {
          if (err) {
            console.error("[PRIMARY] Error executing additional query:", err);
          } else {
            console.log("[PRIMARY] Additional query executed successfully:", results);
          }
        });

        try {
          console.log("[BACKUP] Starting backup upload...");
          const backupUrl = await uploadToBackup(
            originalFilePath,
            cleanFileName,
            cleanFileName,
            'class'
          );

          // Update the same record with backup_url
          const updateQuery = `
            UPDATE recording 
            SET backup_url = ? 
            WHERE videoid = ?
          `;

          // Use Promise wrapper to properly await the database update
          await new Promise((resolveUpdate, rejectUpdate) => {
            connection.query(updateQuery, [backupUrl, videoId], (updateErr, updateResults) => {
              if (updateErr) {
                console.error("[BACKUP] Error updating backup_url in MySQL:", updateErr);
                rejectUpdate(updateErr);
              } else {
                console.log("[BACKUP] Backup URL updated in MySQL:", updateResults);
                console.log("[BACKUP] Backup URL:", backupUrl);
                resolveUpdate(updateResults);
              }
            });
          });

          console.log("[BACKUP] Backup process completed successfully");
          resolve(results);

        } catch (backupError) {
          console.error("[BACKUP] Backup upload failed (non-critical):", backupError.message);
          console.log("[PRIMARY] Primary workflow completed successfully despite backup failure");
          resolve(results); 
        }
      });
    });

    return res.data;
  } catch (error) {
    console.error("[PRIMARY] Error uploading video:", error);
    throw error;
  }
}

module.exports = uploadVideo;
