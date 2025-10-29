// YouTube-Automation/src/session_fileWatcher.js



// **************************for sessions recordings**********************



const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql');
const uploadVideo = require('./session_uploader');
require('dotenv').config();

// Set up MySQL connection
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
const connection = mysql.createConnection(dbConfig);

function watchFolder(uploadPath, donePath, auth) {
    const watcher = chokidar.watch(uploadPath, {
        persistent: true,
        ignoreInitial: true,
        followSymlinks: false,
        depth: 0,
        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100,
        },
    });

    watcher.on('add', async (filePath) => {
        console.log(`File added: ${filePath}`);

        try {
            const fileName = path.basename(filePath);

            if (fileName.startsWith('Class')) {
                // Existing logic for Class files
                const query = 'SELECT COUNT(*) AS count FROM recording WHERE filename = ?';
                connection.query(query, [fileName], async (err, results) => {
                    if (err) {
                        console.error('Error querying MySQL:', err);
                        return;
                    }

                    if (results[0].count > 0) {
                        console.log(`Video already uploaded and saved to DB: ${fileName}`);
                        return; // Exit if video already exists
                    }

                    const videoDetails = await uploadVideo(filePath, auth);
                    console.log(`Video uploaded successfully. YouTube Video ID: ${videoDetails.id}`);

                    const doneFilePath = path.join(donePath, fileName);
                    fs.renameSync(filePath, doneFilePath);
                    console.log(`Moved uploaded file to: ${doneFilePath}`);
                });
            } else if (fileName.startsWith('Session')) {
                // New logic for Session files
                const query = 'SELECT COUNT(*) AS count FROM session WHERE title = ?';
                connection.query(query, [fileName], async (err, results) => {
                    if (err) {
                        console.error('Error querying MySQL:', err);
                        return;
                    }

                    if (results[0].count > 0) {
                        console.log(`Session already uploaded and saved to DB: ${fileName}`);
                        return; // Exit if session already exists
                    }

                    const videoDetails = await uploadVideo(filePath, auth);
                    console.log(`Video uploaded successfully. YouTube Video ID: ${videoDetails.id}`);

                    const doneFilePath = path.join(donePath, fileName);
                    fs.renameSync(filePath, doneFilePath);
                    console.log(`Moved uploaded file to: ${doneFilePath}`);
                });
            }
        } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
        }
    });

    watcher.on('error', (error) => {
        console.error('Error watching folder:', error);
    });
    
}

module.exports = watchFolder;


// ***************************************-------------------------------*********************************************





