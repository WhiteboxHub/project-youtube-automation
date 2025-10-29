# YouTube Automation for WBL Video Upload

This is an automation code for uploading videos to the WBL site,backup youtube channel. The application provides two main functionalities:

1. **Class Video Upload**  
   Handles uploading class videos to the WBL site,backup youtube channel and updates the database with video details.

2. **Session Video Upload**  
   Handles uploading session videos to the WBL site,backup youtube channel and updates the database with video details.

---

## **Available Commands**

### 1. Start Class Video Upload
To start the automation process for class videos, use the following command:
```bash
node src/scheduler.js
```

### 2. Start Session Video Upload
To start the automation process for session videos, use the following command:
```bash
node src/session_schedular.js
```