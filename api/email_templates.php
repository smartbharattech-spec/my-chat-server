<?php
function getVerificationEmailTemplate($verificationLink)
{
    $year = date("Y");
    return <<<HTML
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                background-color: #fff7ed; /* Light orange background */
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                box-shadow: 0 10px 25px rgba(249, 115, 22, 0.1);
                overflow: hidden;
                border: 1px solid rgba(249, 115, 22, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #f97316, #ea580c);
                padding: 40px 20px;
                text-align: center;
            }
            .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            .content {
                padding: 40px;
                color: #4a4a4a;
                line-height: 1.8;
                text-align: center;
            }
            .greeting {
                font-size: 20px;
                color: #9a3412; /* Dark orange text */
                font-weight: 600;
                margin-bottom: 20px;
                display: block;
            }
            .button-container {
                text-align: center;
                margin: 35px 0;
            }
            .button {
                background: linear-gradient(90deg, #f97316, #ea580c);
                color: #ffffff !important;
                padding: 16px 40px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                font-size: 16px;
                display: inline-block;
                box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
                transition: transform 0.2s;
            }
            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5);
            }
            .footer {
                background-color: #fff7ed;
                padding: 30px 20px;
                text-align: center;
                font-size: 12px;
                color: #9a3412;
                border-top: 1px solid #fed7aa;
            }
            .link-text {
                word-break: break-all;
                color: #f97316;
                font-size: 13px;
            }
            .divider {
                height: 1px;
                background: #eee;
                margin: 30px 0;
                border: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MyVastuTool</h1>
            </div>
            <div class="content">
                <span class="greeting">Welcome to MyVastuTool!</span>
                <p>Thank you for starting your journey with us. To unlock the full power of Vastu analysis, please verify your email address.</p>
                
                <div class="button-container">
                    <a href="{$verificationLink}" class="button">Verify My Account</a>
                </div>

                <p style="font-size: 14px; color: #666;">This link will expire in 24 hours.</p>

            </div>
            <div class="footer">
                <p>&copy; {$year} MyVastuTool. All rights reserved.</p>
                <p>Bringing harmony to your space.</p>
            </div>
        </div>
    </body>
    </html>
HTML;
}
?>