const ftp = require("basic-ftp");

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "82.180.142.181",
            user: "u737940041.myvastutool.com",
            password: "/:V/HzB24Sex7b!P",
            secure: false
        });
        console.log("Connected! Uploading dist to /public_html ...");
        await client.ensureDir("/public_html");
        await client.uploadFromDir("dist", "/public_html");
        
        console.log("Uploading API files...");
        await client.uploadFrom("api/get_user_courses.php", "/public_html/api/get_user_courses.php");
        await client.uploadFrom("api/marketplace/get_orders.php", "/public_html/api/marketplace/get_orders.php");
        await client.uploadFrom("api/marketplace/create_order.php", "/public_html/api/marketplace/create_order.php");
        await client.uploadFrom("api/check_course_access.php", "/public_html/api/check_course_access.php");
        await client.uploadFrom("api/update_course_progress.php", "/public_html/api/update_course_progress.php");
        await client.uploadFrom("api/get_course_progress.php", "/public_html/api/get_course_progress.php");
        await client.uploadFrom("api/courses.php", "/public_html/api/courses.php");
        await client.uploadFrom("api/marketplace/chat_get_conversations.php", "/public_html/api/marketplace/chat_get_conversations.php");
        await client.uploadFrom("api/marketplace/chat_send_message.php", "/public_html/api/marketplace/chat_send_message.php");
        
        console.log("Upload completed!");
    } catch(err) {
        console.log(err);
    }
    client.close();
}

deploy();
