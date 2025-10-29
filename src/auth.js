// const { google } = require('googleapis');
// const fs = require('fs');
// const path = require('path');
// const readline = require('readline');

// const credentialsPath = path.join(__dirname, '../config/credentials.json');
// const tokenPath = path.join(__dirname, '../config/token.json');

// async function authenticate() {
//     const credentials = JSON.parse(fs.readFileSync(credentialsPath));
//     const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

//     if (!client_id || !client_secret || !redirect_uris || !redirect_uris.length) {
//         throw new Error('Missing or incorrect credentials in credentials.json');
//     }

//     const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

//     try {
//         const token = fs.readFileSync(tokenPath);
//         oAuth2Client.setCredentials(JSON.parse(token));
//         console.log('Token successfully loaded from token.json');
//     } catch (error) {
//         console.log('No token found, initiating authentication process...');
//         const authUrl = oAuth2Client.generateAuthUrl({
//             access_type: 'offline',
//             scope: 'https://www.googleapis.com/auth/youtube.upload',
//         });
//         console.log('Authorize this app by visiting this url:', authUrl);

//         const rl = readline.createInterface({
//             input: process.stdin,
//             output: process.stdout,
//         });

//         return new Promise((resolve, reject) => {
//             rl.question('Enter the code from that page here: ', (code) => {
//                 rl.close();
//                 oAuth2Client.getToken(code, (err, token) => {
//                     if (err) {
//                         console.error('Error retrieving access token', err);
//                         reject(err);
//                     }
//                     oAuth2Client.setCredentials(token);
//                     fs.writeFileSync(tokenPath, JSON.stringify(token));
//                     console.log('Token stored to', tokenPath);
//                     resolve(oAuth2Client);
//                 });
//             });
//         });
//     }
//     return oAuth2Client;
// }



// module.exports = authenticate;


// const fs = require('fs');
// const path = require('path');
// const { google } = require('googleapis');
// const readline = require('readline');

// const credentialsPath = path.join(__dirname, '../config/credentials.json');
// const tokenPath = path.join(__dirname, '../config/token.json');

// async function authenticate() {
//     const credentials = JSON.parse(fs.readFileSync(credentialsPath));
//     const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

//     if (!client_id || !client_secret || !redirect_uris || !redirect_uris.length) {
//         throw new Error('Missing or incorrect credentials in credentials.json');
//     }

//     const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

//     try {
//         const token = fs.readFileSync(tokenPath);
//         oAuth2Client.setCredentials(JSON.parse(token));

//         // Check if token is expired
//         const currentTime = new Date().getTime();
//         if (currentTime >= oAuth2Client.credentials.expiry_date) {
//             // Refresh the token
//             if (oAuth2Client.credentials.refresh_token) {
//                 const tokens = await oAuth2Client.refreshAccessToken();
//                 oAuth2Client.setCredentials(tokens.credentials);
//                 fs.writeFileSync(tokenPath, JSON.stringify(tokens.credentials));
//                 console.log('Token refreshed and stored to', tokenPath);
//             } else {
//                 console.log('Refresh token is missing, re-authentication required');
//                 await getNewToken(oAuth2Client);
//             }
//         } else {
//             console.log('Token successfully loaded from token.json');
//         }
//     } catch (error) {
//         console.log('No token found or invalid token, initiating authentication process...');
//         await getNewToken(oAuth2Client);
//     }

//     return oAuth2Client;
// }

// async function getNewToken(oAuth2Client) {
//     const authUrl = oAuth2Client.generateAuthUrl({
//         access_type: 'offline',
//         scope: 'https://www.googleapis.com/auth/youtube.upload',
//     });
//     console.log('Authorize this app by visiting this url:', authUrl);

//     const rl = readline.createInterface({
//         input: process.stdin,
//         output: process.stdout,
//     });

//     return new Promise((resolve, reject) => {
//         rl.question('Enter the code from that page here: ', (code) => {
//             rl.close();
//             oAuth2Client.getToken(code, (err, token) => {
//                 if (err) {
//                     console.error('Error retrieving access token', err);
//                     reject(err);
//                 }
//                 oAuth2Client.setCredentials(token);
//                 fs.writeFileSync(tokenPath, JSON.stringify(token));
//                 console.log('Token stored to', tokenPath);
//                 resolve(oAuth2Client);
//             });
//         });
//     });
// }

// module.exports = authenticate;

// const { google } = require('googleapis');
// const fs = require('fs');
// const path = require('path');
// const readline = require('readline');

// const credentialsPath = path.join(__dirname, '../config/credentials.json');
// const tokenPath = path.join(__dirname, '../config/token.json');

// async function authenticate() {
//     const credentials = JSON.parse(fs.readFileSync(credentialsPath));
//     const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

//     if (!client_id || !client_secret || !redirect_uris || !redirect_uris.length) {
//         throw new Error('Missing or incorrect credentials in credentials.json');
//     }

//     const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

//     try {
//         const token = JSON.parse(fs.readFileSync(tokenPath));
//         oAuth2Client.setCredentials(token);

//         // Check if the token has expired and refresh it if necessary
//         if (new Date() > new Date(token.expiry_date)) {
//             console.log('Token expired, refreshing...');
//             const refreshedToken = await oAuth2Client.refreshAccessToken();
//             oAuth2Client.setCredentials(refreshedToken.credentials);
//             fs.writeFileSync(tokenPath, JSON.stringify(refreshedToken.credentials));
//             console.log('Token refreshed and stored to', tokenPath);
//         } else {
//             console.log('Token successfully loaded from token.json');
//         }
//     } catch (error) {
//         console.log('No valid token found, initiating authentication process...');
//         const authUrl = oAuth2Client.generateAuthUrl({
//             access_type: 'offline',
//             scope: 'https://www.googleapis.com/auth/youtube.upload',
//         });
//         console.log('Authorize this app by visiting this url:', authUrl);

//         const rl = readline.createInterface({
//             input: process.stdin,
//             output: process.stdout,
//         });

//         return new Promise((resolve, reject) => {
//             rl.question('Enter the code from that page here: ', (code) => {
//                 rl.close();
//                 oAuth2Client.getToken(code, (err, token) => {
//                     if (err) {
//                         console.error('Error retrieving access token', err);
//                         reject(err);
//                     }
//                     oAuth2Client.setCredentials(token);
//                     fs.writeFileSync(tokenPath, JSON.stringify(token));
//                     console.log('Token stored to', tokenPath);
//                     resolve(oAuth2Client);
//                 });
//             });
//         });
//     }
//     return oAuth2Client;
// }

// module.exports = authenticate;


// const { google } = require('googleapis');
// const fs = require('fs');
// const path = require('path');
// const readline = require('readline');

// const credentialsPath = path.join(__dirname, '../config/credentials.json');
// const tokenPath = path.join(__dirname, '../config/token.json');

// async function authenticate() {
//     const credentials = JSON.parse(fs.readFileSync(credentialsPath));
//     const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

//     if (!client_id || !client_secret || !redirect_uris || !redirect_uris.length) {
//         throw new Error('Missing or incorrect credentials in credentials.json');
//     }

//     const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

//     try {
//         const token = JSON.parse(fs.readFileSync(tokenPath));
//         oAuth2Client.setCredentials(token);

//         // Check if the token has expired and refresh it if necessary
//         if (new Date() > new Date(token.expiry_date)) {
//             console.log('Token expired, refreshing...');
//             const refreshedToken = await oAuth2Client.refreshAccessToken();
//             oAuth2Client.setCredentials(refreshedToken.credentials);
//             fs.writeFileSync(tokenPath, JSON.stringify(refreshedToken.credentials));
//             console.log('Token refreshed and stored to', tokenPath);
//         } else {
//             console.log('Token successfully loaded from token.json');
//         }
//     } catch (error) {
//         console.log('No valid token found, initiating authentication process...');
//         const authUrl = oAuth2Client.generateAuthUrl({
//             access_type: 'offline',
//             scope: 'https://www.googleapis.com/auth/youtube.upload',
//         });
//         console.log('Authorize this app by visiting this url:', authUrl);

//         const rl = readline.createInterface({
//             input: process.stdin,
//             output: process.stdout,
//         });

//         return new Promise((resolve, reject) => {
//             rl.question('Enter the code from that page here: ', (code) => {
//                 rl.close();
//                 oAuth2Client.getToken(code, (err, token) => {
//                     if (err) {
//                         console.error('Error retrieving access token', err);
//                         reject(err);
//                     }
//                     oAuth2Client.setCredentials(token);
//                     fs.writeFileSync(tokenPath, JSON.stringify(token));
//                     console.log('Token stored to', tokenPath);
//                     resolve(oAuth2Client);
//                 });
//             });
//         });
//     }
//     return oAuth2Client;
// }

// module.exports = authenticate;


const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const credentialsPath = path.join(__dirname, '../config/credentials.json');
const tokenPath = path.join(__dirname, '../config/token.json');

async function authenticate() {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    if (!client_id || !client_secret || !redirect_uris || !redirect_uris.length) {
        throw new Error('Missing or incorrect credentials in credentials.json');
    }

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    let token;
    try {
        token = JSON.parse(fs.readFileSync(tokenPath));
        oAuth2Client.setCredentials(token);
    } catch (error) {
        console.log('No token found, initiating authentication process...');
        return await getNewToken(oAuth2Client);
    }
    
    if (isTokenExpired(token)) {
        console.log('Token expired, refreshing...');
        try {
            const refreshedToken = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(refreshedToken.credentials);
            fs.writeFileSync(tokenPath, JSON.stringify(refreshedToken.credentials));
            console.log('Token refreshed and stored to', tokenPath);
        } catch (err) {
            console.error('Error refreshing access token', err);
            return await getNewToken(oAuth2Client);
        }
    } else {
        console.log('Token successfully loaded from token.json');
    }

    return oAuth2Client;
}

function isTokenExpired(token) {
    return !token.expiry_date || new Date() > new Date(token.expiry_date);
}

async function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/youtube.upload',
    });
    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) {
                    console.error('Error retrieving access token', err);
                    reject(err);
                }
                oAuth2Client.setCredentials(token);
                fs.writeFileSync(tokenPath, JSON.stringify(token));
                console.log('Token stored to', tokenPath);
                resolve(oAuth2Client);
            });
        });
    });
}

module.exports = authenticate;
