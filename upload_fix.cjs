const ftp = require("basic-ftp");
const path = require("path");

async function uploadFiles() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "82.180.142.181",
            user: "u737940041.myvastutool.com",
            password: "/:V/HzB24Sex7b!P",
            secure: false
        });
        console.log("Connected! Uploading files...");
        
        await client.uploadFrom("api/courses.php", "/public_html/api/courses.php");
        await client.uploadFrom("debug_course.php", "/public_html/debug_course.php");
        
        console.log("Upload completed!");
    } catch(err) {
        console.log(err);
    }
    client.close();
}

uploadFiles();
