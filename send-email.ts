import { MailLog } from './db-models';

import sendgrid from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();
sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '');

export const sendEmail = async (config: any, entscheide: any, datum: any) => {
  const emailBody = composeBody(config, entscheide);

  let sendError = 'kein Fehler beim Versenden';
  try {
    const email = process.env.MAILTO_OVERRIDE || config.email;
    await sendgrid.send({
      from: 'bger-watch@jimynu.ch',
      to: email,
      subject: `Neue BGer-Urteile vom ${datum}`,
      html: emailBody,
    });
    console.log(' ✔️ Mail gesendet an', email);
  } catch (err) {
    console.error((err as any)?.response?.body);
    sendError = 'Mail konnte nicht gesendet werden.';
  } finally {
    const mailLog = new MailLog({ error: sendError });
    mailLog.save().catch((error) => console.log('write MailLog', error));
  }

  return emailBody;
};

const composeBody = (config: any, { separat, interessant, restliche }: any) => {
  const body: string[] = [];

  // (1) separat auszuweisende urteile
  if (separat.length > 0) {
    body.push(`<strong>=== erwartete Urteile ===</strong><br/><br/>`);
    body.push(`${mapDecisions(separat).join('')}<br/><br/><br/>`);

    // aus config löschen (in separat_archiv verschieben)
    config.archiveSeparat(
      separat.map(({ nr }: any) => nr),
      (error, _result) => {
        if (error) console.log(error);
      },
    );
  }

  // (2) gewählte themen
  body.push(`<strong>=== Urteile zu gewählten Themen ===</strong>
  <br/>${config.themen.join(', ')}<br/><br/>`);

  if (interessant.length === 0) {
    body.push(`Keine Urteile zu den gewählten Themen.<br/><br/>`);
  } else {
    body.push(`${mapDecisions(interessant).join('')}<br/><br/><br/>`);
  }

  // (3) weitere urteile
  body.push(`<strong>=== weitere Urteile ===</strong><br/><br>`);

  if (restliche.length === 0) {
    body.push(`Keine weiteren Urteile.`);
  } else {
    body.push(`${mapDecisions(restliche).join('')}<br/><br/>`);
  }

  return body.join('');
};

const mapDecisions = (decisions: any[]) =>
  decisions.map(
    ({
      nr,
      thema,
      leitentscheid,
      beschreibung,
      details,
    }) => `<strong><a href="https://bger.li/${nr}">${nr}</a>: ${thema}</strong>
  ${leitentscheid ? ' <span style="color: red">(Leitentscheid)</span>' : ''}
  <br/>${beschreibung}
  ${details ? `<br/><span style="color: mediumseagreen">${details}</span>` : ''}
  <br/><br/>`,
  );
