import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { Environments } from 'src/app/environments';
import { Chat } from '../messaging/chat.model';
import { Friends, UserClass } from '../people/user.model';

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  async sendEmail(templateId: string, templateParams: {}) {
    const res = await emailjs.send(
      Environments.EMAILJS_SERVICE_ID,
      templateId,
      templateParams,
      {
        publicKey: 'fEZkI9mcDSDrrWEze',
      },
    );
    return res;
  }

  async sendWelcomeEmail(email: string) {
    let templateParams = {
      fromEmail: 'noreply@flame-chat.hu',
      replyTo: 'kalmaristvan078@gmail.com',
      toEmail: email,
      messageDate: new Date().toLocaleString(),
    };
    const res = await this.sendEmail(
      Environments.EMAILJS_WELCOME_TEMPLATE_ID,
      templateParams,
    );
    console.log(res, 'E-mail sikeresen elküldve');
  }

  async sendMessNotificationEmail(
    friend: Friends,
    message: Chat,
    user: UserClass,
  ) {
    let templateParams = {
      username: friend.displayName,
      message: message.message.message,
      fromUserProfPic: user.profilePicture,
      fromName: user.displayName,
      appName: 'Flame Chat',
      toEmail: friend.email,
      timeStamp: new Date().toLocaleString(),
    };
    const res = await this.sendEmail(
      Environments.EMAILJS_MESSAGED_ME_TEMPLATE_ID,
      templateParams,
    );
    console.log(res, 'E-mail sikeresen elküldve');
  }
}
