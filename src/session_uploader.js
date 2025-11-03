const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const mysql = require("mysql2");
const { executeTransaction } = require("./testMySQLConnection");
const { uploadToBackup } = require("./backup_uploader"); // NEW: Import backup uploader

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
  GitHub: 66,
  RestApi: 68,
};

// --------------------******************session*************************----------------------------------------
async function uploadVideo(filePath, auth) {
  console.log("[PRIMARY] Starting upload process for:", filePath);

  try {
    const youtube = google.youtube({ version: "v3", auth });
    const fileSize = fs.statSync(filePath).size;

    // Extract metadata from file name
    const fileName = path.basename(filePath);
    const parts = fileName.split("_");
    const prefix = parts[0]; // 'Class' or 'Session'

    if (!prefix) {
      console.error("[PRIMARY] Invalid file prefix:", fileName);
      return;
    }

    // Upload video to YouTube (PRIMARY CHANNEL)
    console.log("[PRIMARY] Uploading to primary channel...");
    const res = await youtube.videos.insert(
      {
        part: "snippet,status",
        notifySubscribers: false,
        requestBody: {
          snippet: {
            title: fileName,
            description: fileName,
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
          console.log(`[PRIMARY] ${Math.round(progress)}% complete`);
        },
      }
    );

    if (!res.data || !res.data.id) {
      throw new Error("YouTube upload failed: No video ID returned");
    }

    const videoId = res.data.id;
    const youtubeLink = `https://www.youtube.com/watch?v=${videoId}`;
    const currentDate = new Date();
    const lastModDateTime = currentDate.toISOString().slice(0, 10);

    console.log("[PRIMARY] Upload complete. Video ID:", videoId);

    if (prefix === "Class") {
      // Process "Class" videos
      const batchId = parts[1];
      const subject = parts[4]?.split(".")[0];
      const subjectId = subjectMapping[subject];

      if (!subjectId) {
        console.error("[PRIMARY] Invalid subject:", subject);
        return;
      }

      const batchname = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const classDate = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

      // Insert into recording
      const recordingQuery = `
        INSERT INTO recording (batchname, description, type, classdate, link, videoid, subject, filename, lastmoddatetime, new_subject_id)
        VALUES (?, ?, 'class', ?, ?, ?, ?, ?, ?, ?)
      `;
      const recordingValues = [
        batchname,
        fileName,
        classDate,
        youtubeLink,
        videoId,
        subject,
        fileName,
        lastModDateTime,
        subjectId,
      ];

      // Insert into recording_batch
      const batchQuery = `
        INSERT INTO recording_batch (batchname, subject, lastmoddatetime)
        VALUES (?, ?, ?)
      `;
      const batchValues = [batchname, subject, lastModDateTime];

      await executeTransaction(recordingQuery, recordingValues);
      await executeTransaction(batchQuery, batchValues);

      console.log("[PRIMARY] Class video uploaded and both records inserted successfully.");

            // NEW: Upload to BACKUP CHANNEL for Class videos
      try {
        console.log("[BACKUP] Starting backup upload for Class video...");
        const backupUrl = await uploadToBackup(
          filePath,
          fileName,
          fileName,
          'class' // Type is 'class'
        );

        // Update backup_url in recording table
        const updateQuery = `UPDATE recording SET backup_url = ? WHERE videoid = ?`;
        
        // Use Promise wrapper to properly await the database update
        await new Promise((resolveUpdate, rejectUpdate) => {
          connection.query(updateQuery, [backupUrl, videoId], (updateErr, updateResults) => {
            if (updateErr) {
              console.error("[BACKUP] Error updating backup_url in recording table:", updateErr);
              rejectUpdate(updateErr);
            } else {
              console.log("[BACKUP] Backup URL updated in recording table");
              console.log("[BACKUP] Backup URL:", backupUrl);
              resolveUpdate(updateResults);
            }
          });
        });

        console.log("[BACKUP] Backup process completed successfully for Class video");

      } catch (backupError) {
        console.error("[BACKUP] Backup upload failed (non-critical):", backupError.message);
        console.log("[PRIMARY] Primary workflow completed successfully despite backup failure");
      }

    } else if (prefix === "Session") {
      // Process "Session" videos
      const sessionDate = parts[1];
      const subjectId = parseInt(parts[2], 10);
      const instructorName = parts[3];
      let sessionType = parts[4]?.split(".")[0];

      if (!sessionDate || !subjectId || !sessionType) {
        console.error("[PRIMARY] Invalid session metadata:", fileName);
        return;
      }

      const lowerTitle = fileName.toLowerCase();

      if (lowerTitle.includes("group")) {
        sessionType = "Group Mock";
      } else if (lowerTitle.includes("individual")) {
        sessionType = "Individual Mock";
      } else if (lowerTitle.includes("resume")) {
        sessionType = "Resume Session";
      } else if (lowerTitle.includes("prep") || lowerTitle.includes("preparation")) {
        sessionType = "Interview Prep";
      } else if (lowerTitle.includes("job")) {
        sessionType = "Job Help";
      } else if (lowerTitle.includes("internal")) {
        sessionType = "Internal Sessions";
      } else {
        sessionType = "Misc"; // Default
      }

      const sessionQuery = `
        INSERT INTO session (title, status, sessiondate, type, subject, link, videoid, lastmoddatetime, subject_id)
        VALUES (?, 'Completed', ?, ?, ?, ?, ?, ?, ?)
      `;

      const sessionValues = [
        fileName,
        sessionDate,
        sessionType,
        instructorName,
        youtubeLink,
        videoId,
        lastModDateTime,
        subjectId,
      ];

      await executeTransaction(sessionQuery, sessionValues);
      console.log("[PRIMARY] Session video uploaded and record inserted successfully.");

      try {
        console.log("[BACKUP] Starting backup upload for Session video...");
        const backupUrl = await uploadToBackup(
          filePath,
          fileName,
          fileName,
          'session' // Type is 'session'
        );

        const updateQuery = `UPDATE session SET backup_url = ? WHERE videoid = ?`;
        

        await new Promise((resolveUpdate, rejectUpdate) => {
          connection.query(updateQuery, [backupUrl, videoId], (updateErr, updateResults) => {
            if (updateErr) {
              console.error("[BACKUP] Error updating backup_url in session table:", updateErr);
              rejectUpdate(updateErr);
            } else {
              console.log("[BACKUP] Backup URL updated in session table");
              console.log("[BACKUP] Backup URL:", backupUrl);
              resolveUpdate(updateResults);
            }
          });
        });

        console.log("[BACKUP] Backup process completed successfully for Session video");

      } catch (backupError) {
        console.error("[BACKUP] Backup upload failed (non-critical):", backupError.message);
        console.log("[PRIMARY] Primary workflow completed successfully despite backup failure");
      }

    } else {
      console.error("[PRIMARY] Unknown file prefix:", prefix);
      return;
    }

    return { id: videoId, link: youtubeLink };
  } catch (error) {
    console.error("[PRIMARY] Error in uploadVideo:", error);
    throw error;
  }
}

module.exports = uploadVideo;