const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const mysql = require("mysql2");
require("dotenv").config();

// MySQL database connection configuration
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

// Subject to subjectid mapping
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
  console.log("Starting upload process for:", filePath);

  try {
    const youtube = google.youtube({ version: "v3", auth });
    const fileSize = fs.statSync(filePath).size;

    // Extract batch ID, subject, and clean filename
    const fileName = path.basename(filePath);
    const parts = fileName.split("_");

    // Example: Class_2025-08-29_52_Ajmeer_Python_OopsInheritance_2025-08.wmv
    const classDate = parts[1]; // "2025-08-29"
    const batchname = parts[parts.length - 1].split(".")[0]; // "2025-08"

    // Clean filename (remove batchname before saving)
    const cleanFileName = parts.slice(0, -1).join("_") + path.extname(fileName);

    // Subject extraction
    const subject = parts[4]; // e.g., "Python"
    const subjectId = subjectMapping[subject];

    if (!subjectId) {
      console.error("Invalid subject:", subject);
      return;
    }

    // Upload to YouTube
    const res = await youtube.videos.insert(
      {
        part: "snippet,status",
        notifySubscribers: false,
        requestBody: {
          snippet: {
            title: cleanFileName,
            description: cleanFileName, // Use clean filename
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
          console.log(`${Math.round(progress)}% complete`);
        },
      }
    );

    console.log("Upload complete:", res.data);
    console.log("YouTube Video ID:", res.data.id);

    // Insert video ID into MySQL database
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
      cleanFileName, // save clean filename
      lastModDateTime,
      subjectId,
    ];

    connection.query(query, values, (err, results) => {
      if (err) {
        console.error("Error inserting video ID into MySQL:", err);
      } else {
        console.log("Video ID inserted into MySQL:", results);

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
            console.error("Error executing additional query:", err);
          } else {
            console.log("Additional query executed successfully:", results);
          }
        });
      }
    });

    return res.data;
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
}

module.exports = uploadVideo;
