
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
});

const sendEmail = async (to, subject, message) => {
    try {
        const response = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    sender: {
                        name: "Shopora",
                        email: process.env.EMAIL_FROM,
                    },
                    to: [{ email: to }],
                    subject,
                    htmlContent: message,
                }),
                signal: AbortSignal.timeout(20000),
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                `Brevo API error (${response.status}): ${
                    data.message || JSON.stringify(data)
                }`
            );
        }

        console.log("Email sent successfully:", data.messageId);
        return data;
    } catch (error) {
        console.error("Email sending failed:", error.message);
        throw error;
    }
};

module.exports = { sendEmail };
