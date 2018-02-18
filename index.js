// pkg import
const cheerio = require('cheerio'); // core jQuery for node
const request = require('request');
const iconv = require('iconv-lite'); // umlaute
const sendmail = require('sendmail')();

const db = require('./db');
const Log = require('./dbmodels').Log;
const Day = require('./dbmodels').Day;
const Config = require('./dbmodels').Config;

const composeEmailBody = require('./composeEmailBody');


Config.findOne({ active: true})
  .then( config => {
    if ( !config ) {
      console.log('Keine aktive Konfiguration gefunden!');
    } else {
      console.log('Konfiguration:');
      console.log(config);
      const themen  = config.themen; // können substrings sein, case-insensitive – [ 'bliga' ]
      const separat = config.separat; // separat auszuweisende urteile      – [ '5A_43/2018' ] (13.2.18)
      const emailAn = config.email.join(', '); // auch mehrere möglich: 'test@qq.com, test@sohu.com, test@163.com'
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

                      // handelt es sich um ein separat auszuweisendes urteil?
                      if( (new RegExp( separat.join('|'), 'i' ) ).test(entscheidNr) ){
                        entscheide_separat.push(entscheid);
                      }

                      // ist das thema von interesse?
                      if( (new RegExp( themen.join('|'), 'i' ) ).test(thema) ){
                        entscheide_interessant.push(entscheid);
                      } else {
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
                      console.log(err && err.stack);
                      console.dir(reply);
                    });

                    // in DB schreiben
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
