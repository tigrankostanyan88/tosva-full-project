const nodemailer = require('nodemailer');
const { htmlToText } = require('html-to-text');

class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_EMAIL}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // SendPulse
            return nodemailer.createTransport({
                host: process.env.SENDPULSE_HOST,
                port: process.env.SENDPULSE_PORT,
                auth: {
                    user: process.env.SENDPULSE_USERNAME,
                    pass: process.env.SENDPULSE_PASSWORD
                }
            });
        }

        // mailtrap
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async send(template, subject) {
        const tpl = String(template || '').toLowerCase();
        const firstName = this.firstName || '';
        const url = this.url || '';
        let html = '';
        if (tpl === 'welcome') {
            html = `<div style="font-family:Arial,sans-serif;">
                <h2>Welcome, ${firstName}</h2>
                <p>Glad to have you on board.</p>
            </div>`;
        } else if (tpl === 'resetPassword') {
            html = `<div style="font-family:Arial,sans-serif;">
                <h2>Password Reset</h2>
                <p>Hello ${firstName}, use the link below to reset your password.</p>
                <p><a href="${url}" target="_blank">Reset Password</a></p>
                <p>This link is valid for 10 minutes.</p>
            </div>`;
        } else {
            html = `<div style="font-family:Arial,sans-serif;">
                <h2>${subject}</h2>
                <p>Hello ${firstName}</p>
            </div>`;
        }

        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText(html)
        };
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Fashion shop!');
    }

    async sendResetPassword() {
        await this.send('resetPassword', 'Your password reset token (valid for 10 min)!');
    }
}

module.exports = Email;
