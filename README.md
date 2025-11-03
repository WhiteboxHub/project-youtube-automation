# YouTube Automation for WBL Video Upload

This is an automation code for uploading videos to the WBL site and backup YouTube channel. The application provides two main functionalities:

1. **Class Video Upload**  
   Handles uploading class videos to the primary YouTube channel and backup channel, then updates the database with video details including backup URLs.

2. **Session Video Upload**  
   Handles uploading session videos to the primary YouTube channel and backup channel, then updates the database with video details including backup URLs.

---

## **Prerequisites**

- Node.js (v14 or higher)
- MySQL Database
- Google Cloud Project with YouTube Data API v3 enabled
- OAuth 2.0 credentials for both primary and backup YouTube channels

---

## **Setup Instructions**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd project-youtube-automation
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

### 4. Configure YouTube API Credentials

You need to set up credentials for both primary and backup YouTube channels:

#### Primary Channel:
- Create `config/credentials.json` with your primary YouTube channel OAuth credentials
- Create `config/token.json` with your primary channel access token

#### Backup Channel:
- Create `config/backup_credentials.json` with your backup YouTube channel OAuth credentials
- Create `config/backup_token.json` with your backup channel access token

**Note**: Get these credentials from [Google Cloud Console](https://console.cloud.google.com/)

### 5. Directory Structure
The following directories will be used:
- `uploads/` - Place video files here for processing
- `done/` - Processed videos are moved here
- `config/` - Contains all configuration and credential files

---

## **Available Commands**

### 1. Start Class Video Upload
To start the automation process for class videos:
```bash
node src/scheduler.js
```

### 2. Start Session Video Upload
To start the automation process for session videos:
```bash
node src/session_schedular.js
```

---

## **Features**

- ✅ Automatic video upload to primary YouTube channel
- ✅ Automatic backup upload to secondary YouTube channel
- ✅ Database integration with MySQL
- ✅ Automatic video metadata extraction from filename
- ✅ File watching for automatic processing
- ✅ Backup URL storage in database
- ✅ Support for both Class and Session recordings

---

## **Important Notes**

- Credential files (`credentials.json`, `token.json`, etc.) are **not tracked** in git for security
- Make sure to set up your own credentials before running the application
- Video files are automatically moved to `done/` folder after successful upload
- Both primary and backup URLs are stored in the database for redundancy
