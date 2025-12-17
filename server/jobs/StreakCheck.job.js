const cron = require('node-cron');

cron.schedule('0 0 * * *', async () => {
    console.log('Running Streak Check every day...')
});