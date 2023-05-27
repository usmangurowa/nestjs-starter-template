import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

@Injectable()
export class MailService {
  private client: SibApiV3Sdk.ApiClient;
  private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;

  constructor() {
    this.client = SibApiV3Sdk.ApiClient.instance;
    this.client.authentications['api-key'].apiKey =
      process.env.SENDINBLUE_API_KEY;
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async sendEmail(
    to: { email: string; name: string }[],
    subject: string,
    content: string,
  ) {
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent =
      '<html><body><h1>{{params.otp}}</h1></body></html>';
    sendSmtpEmail.sender = { name: 'Usman', email: 'usman@finuel.com' };
    sendSmtpEmail.to = [...to];
    sendSmtpEmail.params = {
      otp: content,
    };

    try {
      let data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
