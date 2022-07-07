import _fetch from 'node-fetch';
import { countArray, fetchLogger, timestamp } from './util.js';

/*
* Function to post data to Pipedrive and create the activities
* Parameters are config from where the token & url is read and data, which are the gists that need to be posted
* Returns an array of activities that have been created
*/
export async function postPipedrive(config, data) {

    //preparing the data so it can be easily posted to pipedrive
    const postData = preparePipedriveData(data);

    //used as the return value
    const responseArray = [];
    const url = `https://${config.pipedriveBaseUrl}.pipdrive.com/v1/activities?api_token=${config.pipedriveToken}`;

    //For every entry in the prepared data, an individual POST call is made to Pipedrive and the activity is created
    for (const entry of postData) {
        try {
            const response = await _fetch(url, {
                method: 'POST',
                body: JSON.stringify(entry),
                headers: { 'Content-Type': 'application/json' }
            })
            const json = await response.json();

            //if the fetch response status is 201 (created), the successful POST made is pushed into the array so it can be returned (and later be used)
            if (response.status !== 201) {
                throw new Error(`${fetchLogger(response, 'ERROR')} Error message: ${json.error}`)
            } else {
                console.log(`${fetchLogger(response, 'INFO')} Activity created with id: ${json.data.id}`)
                responseArray.push({ id: json.data.id, subject: json.data.subject, success: json.success })
            }

        } catch (error) {
            console.log(error);
        }
    }
    console.log(`${timestamp()} [INFO] Total activities posted: ${responseArray.length}`)
    return responseArray;
}


/*
* Function to get Github gists from all users that are currently tracked/scanned
* Parameters are the a config file, from where the token & url is read, users, which is the array of all users currently tracked/ scanned and lastRun, 
* which is a global variable that tracks if the entire scheduled job has already been run in the past
* Returns a response array which includes all gists that have been fetched
*/

export async function getGithubData(config, users, lastRun) {
    // Used to return all gists
    let responseArray = [];

    //Separate GET calls are made for every users that is being scanned
    for (const user of users) {
        let url = `https://${config.githubBaseUrl}/users/${user.name}/gists`;

        //lastRun is initialised as "never"
        if (lastRun !== "never") {
            //if the job has successfully ran in the past, I am only interested in the gists that were created since then
            url += `?since=${lastRun}`;
        }

        try {
            const response = await _fetch(url, {
                method: 'GET',
                headers: {
                    "Accept": "application/vnd.github+json",
                    "Authorization": `token ${config.githubToken}`
                }
            });
            const json = await response.json();

            //If the GET call was successful (HTTP 200), the result is pushed into the response array, so it can be used in other functions
            if (response.status !== 200) {
                throw new Error(`${fetchLogger(response, 'ERROR')} Error message: ${json.message} for user: ${user.name}`);
            } else {
                console.log(`${fetchLogger(response, 'INFO')} SUCCESS for user: ${user.name}`);
                responseArray.push(json);
            }
            
        } catch (error) {
            console.log(error);
        }

    }
    console.log(`${timestamp()} [INFO] Total gists fetched: ${countArray(responseArray)}`);
    return responseArray;
}


/*
* Function to get the gists from one specific user
* Parameters are the config, from where url & token is read, and the user from whom the gists will be fetched
* Returns the fetched gists
*/

export async function getGithubDataforUser(config, user) {
    let url = `https://${config.githubBaseUrl}/users/${user.name}/gists`;

    //user.lastVisit is a property defined in the config file, and it is initially empty
    if (user.lastVisit) {
        //If the gists for an individual user have been looked at in the past, only the new gists since then should be returned
        url += `?since=${user.lastVisit}`;
    }

    try {
        const response = await _fetch(url, {
            method: 'GET',
            headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": `token ${config.githubToken}`
            }
        });
        const json = await response.json();

        //If GET request is successful, the json is returned to be displayed 
        if (response.status !== 200) {
            throw new Error(`${fetchLogger(response, 'ERROR')} Error message: ${json.message} for user: ${user.name}`);
        } else {
            console.log(`${fetchLogger(response, 'INFO')} SUCCESS for user: ${user.name}`);
            return json;
        }
        
    } catch (error) {
        console.log(error);
    }
}

/*
*Function to prepare the data to be sent to Pipedrive
*Parameters is the json which will be prepared. This will be the gists fetched from the getGithubData endpoint
*Returns and array with object that can be easily passed into the body of a POST request
*/
export function preparePipedriveData(json) {
    console.log(timestamp() + " [INFO] Preparing data for Pipedrive. Received gists: " + countArray(json))
    
    //used to return the objects
    let returnArray = [];

    //The JSON data will be in a two-dimensional array, so it needs to iterate over both
    for (const entries of json) {
        for (const gists of entries) {
            //There are many key-value pairs in a gist, only some of them are used to form the data in order to be easily identifiable in Pipedrive
            returnArray.push({ subject: gists.id, note: gists.html_url + "; Owner: " + gists.owner.login, type: "Task", done: 0 });
        }
    }
    console.log(timestamp() + " [INFO] Data finished preparing. Created entries: " + countArray(json))
    return returnArray;

}




