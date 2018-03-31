// pkg import
const cheerio = require('cheerio'); // core jQuery for node
const request = require('request');
const iconv = require('iconv-lite'); // umlaute
const sendmail = require('sendmail')();

const db = require('./db');
const Log = require('./dbmodels').Log;
const MailLog = require('./dbmodels').MailLog;
const Day = require('./dbmodels').Day;
const Config = require('./dbmodels').Config;

const composeEmailBody = require('./composeEmailBody');
const returnRegExOrFalse = array => {
  if ( array.length === 0 ) return false;
  else return new RegExp( array.join('|'), 'i');
}

Config.findOne({ active: true})
  .then( config => {
    if ( !config ) {
      console.log('Keine aktive Konfiguration gefunden!');
    } else {
      console.log('Konfiguration:');
      console.log(config);

      const separat = config.separat; // separat auszuweisende urteile
      const regEx_separat = returnRegExOrFalse(separat)

      const themen  = config.themen; // können substrings sein, case-insensitive
      const regEx_themen = returnRegExOrFalse(themen)

      const emailAn = config.email.join(', '); // mehrere möglich: 'a@b.com, test@bla.ch'
      const startURL = 'https://www.bger.ch/ext/eurospider/live/de/php/aza/http/index_aza.php?lang=de&mode=index&search=false';

      request(startURL, (error, response, body) => {
        if ( error === null ) {
          const $ = cheerio.load(body);
          const links = $('main p').last().find('a'); // inhalt des letzten (zweiten) <p> in <main>

          let tagesliste = [];
          for ( let i = 0; i < links.length; i++ ) {
            const datum = links[i].children[0].data;
            const url = links[i].attribs.href;
            tagesliste.push({ datum, url });
          }

          // liste der tage loggen
          const newLog = new Log({ gefundene_tage: tagesliste })
          newLog.save()
            .catch( error => console.log(error) );

          // durch alle tage loopen
          for (let i = 0; i < tagesliste.length; i++) {
            const durchgang = i; // i "freezen" für async

            // datum schon in DB?
            Day.findOne({ datum: tagesliste[durchgang].datum })
              .then( datum => {

                console.log('');
                console.log('tag ' + durchgang + ': ' + tagesliste[durchgang].datum);

                if (datum) { // schon in DB
                  console.log(tagesliste[durchgang].datum + ' ist schon in der DB');
                  return;
                }

                // noch nicht in DB: urteile an diesem datum durchgehen
                request( {url: tagesliste[durchgang].url, encoding: null}, (error, response, body) => {
                  if ( error === null ) {
                    const $ = cheerio.load(iconv.decode(new Buffer(body), 'cp1252')); // umlaute
                    const rows = $('main table').last().find('tr'); // inhalt der letzten (zweiten) <table> in <main>

                    const entscheide_separat = [];
                    const entscheide_interessant = [];
                    const entscheide_restliche = [];

                    // liste mit urteilen durchgehen
                    for ( let j = 1; j < rows.length; j+=2 ) {
                      console.log('row no. ' + j);
                      const cols = rows[j].children.filter( ({type}) => type === 'tag'); // nur die 5 <td>s
                      const thema = cols[4].children[0].children[0].data;
                      const entscheidNr = cols[2].children[0].children[0].data;
                      const leitentscheid = thema.search(/\*/) >= 0;
                      const beschreibung = rows[j+1].children.filter( ({type}) => type === 'tag')[4].children[0].data

                      const entscheid = {
                        nr: entscheidNr,
                        leitentscheid,
                        beschreibung,
                        thema
                      }

                      // urteile in 3 "interessenstufen" einsortieren
                      if ( regEx_separat && regEx_separat.test(entscheidNr) ) { // (1) urteil erwartet -> separat ausweisen
                        entscheide_separat.push(entscheid);
                      } else if ( regEx_themen && regEx_themen.test(thema) ) { // (2) thema von interesse
                        entscheide_interessant.push(entscheid);
                      } else { // (3) restliche urteile
                        entscheide_restliche.push(entscheid);
                      }
                    }

                    const emailBody = composeEmailBody( config, themen, entscheide_separat, entscheide_interessant, entscheide_restliche);


                    sendmail({
                      from: 'no-reply@yourdomain.com',
                      to: emailAn,
                      subject: `Neue BGer-Urteile vom ${tagesliste[durchgang].datum}`,
                      html: emailBody,
                    }, (err, reply) => {
                      console.log(err && error.stack);
                      console.dir(reply);

                      // MailLog in DB schreiben
                      let error = 'kein Fehler beim Versenden';
                      if (err) error = err.stack;
                      const mailLog = new MailLog({ error, reply });
                      mailLog.save()
                        .catch( error => console.log(error) );
                    });

                    // Tag mit Urteilen in DB schreiben
                    console.log('wegschreiben!');
                    const newDay = new Day({
                      datum: tagesliste[durchgang].datum,
                      url: tagesliste[durchgang].url,
                      entscheide_interessant,
                      entscheide_restliche,
                      html_gesendet: emailBody
                    });
                    newDay.save()
                      .catch( error => console.log(error) );
                  }
                });
              })
            // nächster tag
          }
        }
      });
    }
  })
  .catch( error => console.log(error) );
