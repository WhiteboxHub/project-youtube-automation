const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const credentialsPath = path.join(__dirname, '../config/backup_credentials.json');
const tokenPath = path.join(__dirname, '../config/backup_token.json');

async function authenticateBackup() {
  const credentials = JSON.parse(fs.readFileSync(credentialsPath));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  if (!client_id || !client_secret || !redirect_uris || !redirect_uris.length) {
    throw new Error('Missing or incorrect credentials in backup_credentials.json');
  }

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  let token;
  try {
    token = JSON.parse(fs.readFileSync(tokenPath));
    oAuth2Client.setCredentials(token);
  } catch (error) {
    console.log('No backup token found, initiating authentication process...');
    return await getNewToken(oAuth2Client);
  }

  if (isTokenExpired(token)) {
    console.log('Backup token expired, refreshing...');
    try {
      const refreshedToken = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(refreshedToken.credentials);
      fs.writeFileSync(tokenPath, JSON.stringify(refreshedToken.credentials));
      console.log('Backup token refreshed and stored to', tokenPath);
    } catch (err) {
      console.error('Error refreshing backup access token', err);
      return await getNewToken(oAuth2Client);
    }
  } else {
    console.log('Backup token successfully loaded from backup_token.json');
  }

  return oAuth2Client;
}

function isTokenExpired(token) {
  return !token.expiry_date || new Date() > new Date(token.expiry_date);
}

async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ],
  });

  console.log('Authorize BACKUP CHANNEL by visiting this url:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('Error retrieving backup access token', err);
          reject(err);
        }

        oAuth2Client.setCredentials(token);
        fs.writeFileSync(tokenPath, JSON.stringify(token));
        console.log('Backup token stored to', tokenPath);
        resolve(oAuth2Client);
      });
    });
  });
}

module.exports = authenticateBackup;
