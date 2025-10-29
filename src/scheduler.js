
// const cron = require('node-cron');
const path = require('path');
const watchFolder= require('./fileWatcher');
const authenticate = require('./auth');

const instanceConfigs = [
    {
        
        uploadPath: path.join(__dirname, '../uploads/instance1'),
        donePath: path.join(__dirname, '../done/instance1'),
    },
    {
        uploadPath: path.join(__dirname, '../uploads/instance2'),
        donePath: path.join(__dirname, '../done/instance2'),
    },
];

// async function startSchedulers() {
//     try {
//         const auth = await authenticate();

//         instanceConfigs.forEach((config) => {
//             cron.schedule('* * * * *', () => {
//                 watchFolder(config.uploadPath, config.donePath, auth);
//             });
//         });
//     } catch (error) {
//         console.error('Failed to authenticate:', error);
//     }
// }

// startSchedulers();

async function startSchedulers() {
    try {
        const auth = await authenticate();
        console.log('-------------------------------------------------------------------------------------------classes scheduler is started----------------------------------------')
        
        instanceConfigs.forEach((config) => {
            // cron.schedule('* * * * *', () => {
                console.log(`Watching folder: ${config.uploadPath}`);
                watchFolder(config.uploadPath, config.donePath, auth);
            // });
        });
    } catch (error) {
        console.error('Failed to authenticate:', error);
    }
}

startSchedulers();


// const cron = require('node-cron');
// const path = require('path');
// const watchFolder = require('./fileWatcher');
// const authenticate = require('./auth');

// const instanceConfigs = [
//     {
//         uploadPath: path.join(__dirname, '../uploads/instance1'),
//         donePath: path.join(__dirname, '../done/instance1'),
//     },
//     {

//         uploadPath: path.join(__dirname, '../uploads/instance2'),
//         donePath: path.join(__dirname, '../done/instance2'),
//     },
// ];

// async function startSchedulers() {
//     try {
//         const auth = await authenticate();

//         instanceConfigs.forEach((config) => {
//             cron.schedule('* * * * *', () => {
//                 watchFolder(config.uploadPath, config.donePath, auth);
//             });
//         });
//     } catch (error) {
//         console.error('Failed to authenticate:', error);
//     }
// }

// startSchedulers();
