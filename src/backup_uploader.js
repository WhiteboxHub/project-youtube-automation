const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const authenticateBackup = require('./backup_auth');

// Backup channel playlist IDs
const BACKUP_PLAYLIST_ID_CLASS = 'PLTggMWCaPKQwr_MALVMl_m1aQCo1qgrE1';
const BACKUP_PLAYLIST_ID_SESSION = 'PLTggMWCaPKQzANMg4BVI7Zri5i3KjV-If';

/**
 * Upload video to backup YouTube channel
 * @param {string} filePath - Full path to video file
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @param {string} type - 'class' or 'session'
 * @returns {Promise<string>} - Returns backup video URL
 */
async function uploadToBackup(filePath, title, description, type) {
  try {
    console.log(`[BACKUP] Starting backup upload for: ${title}`);
    
    // Authenticate with backup channel
    const auth = await authenticateBackup();
    const youtube = google.youtube({ version: 'v3', auth });

    // Determine playlist based on type
    const playlistId = type.toLowerCase() === 'class' 
      ? BACKUP_PLAYLIST_ID_CLASS 
      : BACKUP_PLAYLIST_ID_SESSION;

    console.log(`[BACKUP] Detected type: ${type}, using playlist: ${playlistId}`);

    // Upload video with private + age-restricted settings
    const videoInsertResponse = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title,
          description: description,
          categoryId: '22', // People & Blogs category
        },
        status: {
          privacyStatus: 'private', // Set as private
          selfDeclaredMadeForKids: false, // Required for age restriction
        },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    });

    const videoId = videoInsertResponse.data.id;
    const backupUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`[BACKUP] Video uploaded successfully. Video ID: ${videoId}`);
    console.log(`[BACKUP] Backup URL: ${backupUrl}`);

    // Add video to playlist
    try {
      await youtube.playlistItems.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId,
            },
          },
        },
      });
      console.log(`[BACKUP] Video added to playlist: ${playlistId}`);
    } catch (playlistError) {
      console.error(`[BACKUP] Error adding to playlist (non-critical):`, playlistError.message);
      // Don't throw - playlist addition is not critical
    }

    // Set age restriction (YouTube API doesn't have direct age restriction endpoint)
    // Age restriction is typically set through contentDetails.contentRating
    // For now, we set selfDeclaredMadeForKids: false which allows manual age restriction
    console.log(`[BACKUP] Note: Age restriction must be set manually in YouTube Studio if required`);

    return backupUrl;

  } catch (error) {
    console.error('[BACKUP] Error uploading to backup channel:', error.message);
    throw error; // Throw so caller can handle
  }
}

module.exports = { uploadToBackup };
