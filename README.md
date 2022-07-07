# pipedriveTestTask

## Assignment
### Github API & Pipedrive API

Using the Github API you should be able to query a user's publicly available github gists and create a deal/activity in Pipedrive for each gist. Implement an application that periodically checks for a user's publicly available gists, this application should also have a web endpoint where it should show the gists for that user that were added since the last visit.

* You can use any programming language you want
* No need to get crazy with HTML/CSS or JSON apis, a simple text response will suffice
* Document your assumptions based on your understanding of the problem and justify your decisions
* Make sure your application should provide Good output, clear logging and as clear as possible about what its doing
* README file with clear instructions on how to run the application on our local computers
* Implement an endpoint that show all users that are been scanned.

## Installation

### Requirements 

Node.js v 16.15.1 was used to develop the app

The following packages need to be installed:
- express
- html
- node-cron
- node-fetch
- uuid

The exact version numbers of the dependencies are:

```bash
    "express": "^4.18.1",
    "html": "^1.0.0",
    "node-cron": "^3.0.1",
    "node-fetch": "^2.6.7",
    "uuid": "^8.3.2"
```

To run the file, clone the repository or download the files in a zip file and extract them to a directory.

In the node.js command prompt, enter **node main.js**

### Setup
Before the app can be run correctly, navigate to the "config.json" file, and enter your Pipedrive company domain, Pipedrive API toke, Github token, and the users that should be scanned.
Currently, my test user is still present in the file which can be left for testing, and new users can be added in the JSON 'users' array with name: <Github username> and lastVisit: "". (like example "testuser2")

Afterward, the app can be started.


## Usage

After the app has started, the output will be in the console, and the steps that are performed are logged there. Once the server starts, all gists will be initiallt fetched once, and the activities created. The cronjobs starts as well and will run the same operation every 15 minutes.

Additionally, by navigating to localhost:3001, the landing page will be shown which allows accessing the endpoint which lists all users currently tracked and gists for individual users since the last visit. 


## Assumptions

The requirements didn't list a need to save the fetched gists anywhere, so this was not focused on. The gists are written and saved into a JSON file should there be a need for them in the future. However, if further processing of those gists would need to occur, it would be better to save them in a database.

The requirements mention:

> this application should also have a web endpoint where it should show the gists for that user that were added since the last visit

It was not clear whether this means that the gists should be shown for which activities were created, since the last visit, or if generally gists should be shown for that user since the last visit.
I have opted to show the gists that were created since the last visit. Due to the application using two different timestamps to track the cronjob and the manual accessing of the page (or making an API call to the endpoint). The results should be the same, except in cases where an error occurred in the cronjob and the actions were not created or a gist has been created and then the endpoint directly called/ the page accessed.

The users that are tracked are currently in the config file, and no endpoint was created to add or delete users. This is due to the app running mostly automatically and doing its thing in the background. Additionally, the last visit of the users is also tracked in the config file, which is empty. The idea behind that was that the config object could be amended and the config file overwritten to create persistency across runs. During testing, however, it is easier to leave it empty.

The cronjob is hardcoded to run every 15 minutes. This amount of time seems to be good to see the functionality of the app while also being able to create gists in between runs to be able to test it properly.

The endpoints and routes were created using express, however, as only two actual endpoints were created no Express router was used


