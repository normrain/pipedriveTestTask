import fs from 'fs'

/*
* Function that writes data to a file
* Parameter is the data that will be written
* The function appends newly received data, and creates a file gists.json if it doesn't exist
* No return
*/
export function writeData(data){
    console.log(timestamp() +" [INFO] Starting to write file")
    try {
        fs.writeFileSync(`./gists.json`, data, {flag:'a+'})
    } catch (error) {
      console.log (`${timestamp()} [ERROR] ${error}`) 
    }
    
    
    console.log(timestamp() +" [INFO] File written successfully");
}

/*
* Function that reads a file and parses it contents to a JSON
* Parameter is the path to the file
* Return is the JSON
*/
export function readConfig(path){
    try{
        const rawdata = fs.readFileSync(path)
        const config = JSON.parse(rawdata);
        return config;
    }catch(error){
        console.log(error)
    }

}

//Helper to create ISO time stamps. This is necessary for the Github API as query parameter 'since' takes ISO time stamps only
export const timestamp = () => new Date().toISOString();

//Counts elements of multidimensional arrays
export const countArray = array => array.flat().length;

//Used for console logs in the Fetch API
export const fetchLogger = (response, mode) => `${timestamp()} [${mode}] HTTP ${response.status} ${response.statusText} ---`;
