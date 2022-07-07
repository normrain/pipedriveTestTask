import express from 'express';
import _fetch from 'node-fetch';
import { getGithubData, postPipedrive, getGithubDataforUser } from "./dataHandling.js";
import { countArray, readConfig, timestamp, writeData } from './util.js';
import { schedule } from 'node-cron';
import fs from 'fs'

//The config includes the users to be tracked as well as other data. If that file does not exist, the app stops as there is no point continuing
if(!fs.existsSync("./config.json")){
    console.log(`${timestamp()} [ERROR] Config file does not exist. Exiting...`)
    process.exit()
}

const config = readConfig("./config.json");
const users = config.users;

//lastRun keeps track of the last successful run of the cronjob (Github data fetched & posted to Pipedrive)
let lastRun = "never";
const app = express();
const PORT = process.env.PORT || 3001;


//Cronjob that looks for new gists from Github and creates Activities in Pipedrive. It is currently scheduled to run every 15 minutes for testing purposes
const cronjob = schedule("*/15 * * * *", async () => {
    //If no user is being tracked the cronjob logs a warning about that. No API call is made in that scenario
    if (users.length > 0) {

        //Fetching the Github gists and waiting for the results
        const githubGists = await getGithubData(config, users, lastRun)

        //If the result of the GET is empty (i.e. no new gists have been created) this will be logged and no further action will be taken until the next cycle
        if (countArray(githubGists) > 0) {

            //Gists are saved to a file in case they need to be used later
            writeData(JSON.stringify(githubGists))

            //The gists are posted to Pipedrive
            const postedData = await postPipedrive(config, githubGists);

            //Only if the POST is successful, is lastRun updated. If the POST fails, lastRun remains the same, and basically the same GET + POST operation is carried out
            if (postedData.length > 0) {
                lastRun = timestamp();
            } else {
                console.log(`${timestamp()} [WARN] POST to Pipedrive failed. Retry in next cycle. Current last successful run: ${lastRun}`)
            }
        } else {
            console.log(`${timestamp()} [INFO] No new gists have been created since last run. Nothing will be sent to Pipedrive`)
        }
    } else {
        console.log(`${timestamp()} [WARN] No users are currently tracked. Add them to the config file`)
    }
});



app.use(express.static('public'));


//Landing page with link to user endpoint
app.get('/', (req, res, next) => {
    res.status(200).send("<h2>Application</h2> <br> Click <a href=/users/>here</a> to see scanned users")
})


//Displays all currently tracked users on users endpoint. Every username is a link to the individual user's gists
app.get('/users', (req, res, next) => {
    let displayString = ''
    for (let user of users) {
        displayString += `<br> <a href="/users/${user.name}">${user.name}</a>`
    }
    res.status(200).send(`<h2>Users that are being scanned:</h2> <br> ${displayString}`);
})

//Displays individual user's gists
app.get('/users/:name', async (req, res, next) => {

    //previousVisit is used to keep properly display the users previous visit. It is initialised with "First Visit" to look nice
    let previousVisit = "First Visit";

    //Getting the user from which the gists will be fetched
    let currentUser = users.find(user => user.name === req.params.name);

    //The user entered may not exist, so that needs to be handled
    if (currentUser) {
        //if the user has previously visited the website, that date is what will be displayed on the page itself
        if (currentUser.lastVisit) {
            previousVisit = currentUser.lastVisit
        }

        //Getting the Github gists for the user on which link was clicked
        let gists = JSON.stringify(await getGithubDataforUser(config, currentUser));

        //if the GET call fails due to an error, the users last visit will remain the same so they can see their gists at a later time
        currentUser.lastVisit = !gists ? currentUser.lastVisit : timestamp();

        //If the gists don't have any results, either due to an error in the GET call, or because there were no results since the last visit, gists is set to the string to look better
        if (!gists || gists === "[]") {
            gists = "No gists to display!"
        }

        res.status(200).send(`<h2>Gists since last visited:</h2> <br> ${gists}<br><br>Last visited: ${previousVisit} <br><a href="./">Back</a>`);
    } else {
        res.status(404).send(`User does not exist <br><a href="./">Back</a>`);
    }
})

//Final route to catch all other options
app.get('*', (req, res, next) => {
    res.status(404).send("This page does not exist")
})

app.listen(PORT, () => {
    console.log(`${timestamp()} [INFO] Server has started listening on port ${PORT}`);
    console.log(`${timestamp()} [INFO] Users tracked: ${JSON.stringify(config.users)} --- Pipedrive company domain: ${JSON.stringify(config.pipedriveBaseUrl)}`)

});