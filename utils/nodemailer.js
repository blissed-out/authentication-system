import nodemailer from "nodemailer"

const sendMail = async (host, user, pass, from, to, subject, text, html) => {
    const transporter = nodemailer.createTransport({
        host: host,
        port: 587,
        secure: false, // true for port 465, false for other ports
        auth: {
            user: user,
            pass: pass
        },
    });

    const info = await transporter.sendMail({
        from: from,
        to: to,
        subject: subject,
        text: text,
        html: html
    });

    console.log("Message sent: %s", info.messageId);
}
export default sendMail;
