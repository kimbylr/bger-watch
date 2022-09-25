import { load as cheerio } from 'cheerio';
import fetch from 'cross-fetch';

import { connectToDB } from './db';
import { Day, Log } from './db-models';
import { mapDecisions } from './decisions';
import { getConfig, handleUmlauts } from './helpers';
import { sendEmail } from './send-email';
import { sortDecisions } from './decisions';

const START_URL =
  'https://www.bger.ch/ext/eurospider/live/de/php/aza/http/index_aza.php?lang=de&mode=index&search=false';

export const run = async () => {
  await connectToDB();
  const { config, detailSearch, ...regExps } = await getConfig();

  console.log('... parsing overview page ...');
  const overviewPageRes = await fetch(START_URL);
  if (!overviewPageRes.ok) {
    console.error(overviewPageRes);
    throw new Error();
  }

  const $ = cheerio(await overviewPageRes.text());
  const links = $('main p').last().find('a');
  if (!links.length) {
    console.error('Keine Links gefunden');
    throw new Error();
  }

  const daysFromOverviewPage: { datum: string; url: string }[] = [];
  for (const link of links) {
    const datum = link.firstChild?.type === 'text' && link.firstChild.data;
    datum && daysFromOverviewPage.push({ datum, url: link.attribs.href });
  }

  // save to DB
  try {
    const newLog = new Log({ gefundene_tage: daysFromOverviewPage });
    newLog.save();
  } catch (err) {
    console.error(err);
    throw new Error();
  }

  console.log('... looping over days ...');
  for (const { datum, url } of daysFromOverviewPage) {
    if (await Day.findOne({ datum })) {
      return console.log(`- ${datum}: Already in DB`);
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`- ${datum}: Error fetching decisions page`, res);
      throw new Error();
    }

    const body = await handleUmlauts(res);
    const $ = cheerio(body);
    const rows = $('main table').last().find('tr');

    const decisions = sortDecisions({
      entscheide: await mapDecisions(rows, detailSearch),
      ...regExps,
    });

    console.log(`- ${datum}: Sending email`);
    const emailBody = await sendEmail(config, decisions, datum);

    console.log(`- ${datum}: Saving in DB`);
    const newDay = new Day({
      datum,
      url,
      entscheide_separat: decisions.separat,
      entscheide_interessant: decisions.interessant,
      entscheide_restliche: decisions.restliche,
      html_gesendet: emailBody,
    });
    newDay.save().catch((error) => console.log(error));
  }
};
