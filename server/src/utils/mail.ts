import nodemailer from "nodemailer";
import {
  MAILTRAP_SMTP_HOST,
  MAILTRAP_SMTP_PORT,
  MAILTRAP_SMTP_USERNAME,
  MAILTRAP_SMTP_PASSWORD,
} from "./env";

import MailGen, { Content } from "mailgen";
import logger from "../loggers/winston.logger";

interface EmailVerificationTemplate {
  username: string;
  emailVerificationToken: string;
}

interface ResetPasswordTemplate {
  username: string;
  resetPasswordToken: string;
}

interface MailConfig {
  email: string;
  subject: string;
  template: Content;
}

const emailVerificationTemplate = ({
  username,
  emailVerificationToken,
}: EmailVerificationTemplate): Content => {
  return {
    body: {
      name: username,
      intro: "Welcome to SERVER! We’re excited to have you on board.",
      action: {
        instructions:
          "To verify your email address, please click the button below:",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: `http://localhost:5173/verify?token=${emailVerificationToken}`,
        },
      },
      outro:
        "If you did not sign up for a MyApp account, you can safely ignore this email.",
    },
  };
};

const resetPasswordTemplate = ({
  username,
  resetPasswordToken,
}: ResetPasswordTemplate): Content => {
  return {
    body: {
      name: username,
      intro:
        "You have requested to reset your password. Click the button below to proceed.",
      action: {
        instructions: "To reset your password, please click the button below:",
        button: {
          color: "#D9534F",
          text: "Reset Your Password",
          link: `http://localhost:5173/forgot-password?token=${resetPasswordToken}`,
        },
      },
      outro:
        "If you did not request a password reset, no further action is required. Your account is safe.",
    },
  };
};

const sendEmail = async (mailConfig: MailConfig) => {
  const mailGenerator = new MailGen({
    theme: "default",
    product: {
      name: "SERVER",
      link: "https://github.com/arshitcc",
    },
  });

  const emailHTML = mailGenerator.generate(mailConfig.template);
  const emailText = mailGenerator.generatePlaintext(mailConfig.template);

  const mailer = nodemailer.createTransport({
    host: MAILTRAP_SMTP_HOST,
    port: MAILTRAP_SMTP_PORT,
    auth: {
      user: MAILTRAP_SMTP_USERNAME,
      pass: MAILTRAP_SMTP_PASSWORD,
    },
  } as nodemailer.TransportOptions);

  const emailData = {
    from: "server@gmail.com",
    to: mailConfig.email,
    subject: mailConfig.subject,
    text: emailText,
    html: emailHTML,
  };

  try {
    await mailer.sendMail(emailData);
  } catch (error) {
    /*
      As sending email is not strongly coupled to the business logic it is not worth to raise an error when email sending fails
      So it's better to fail silently rather than breaking the app
    */

    logger.error(
      "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
    );
    logger.error("Error: ", error);
  }
};

export { sendEmail, emailVerificationTemplate, resetPasswordTemplate };
