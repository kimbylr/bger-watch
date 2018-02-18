const mongoose = require ('mongoose');
mongoose.Promise = global.Promise;


const LogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  gefundene_tage: []
});

const DaySchema = new mongoose.Schema({
  datum: String,
  url: String,
  entscheide_interessant: [ {
    nr: String,
    leitentscheid: Boolean,
    thema: String,
    beschreibung: String
  } ],
  entscheide_restliche: [ {
    nr: String,
    leitentscheid: Boolean,
    thema: String,
    beschreibung: String
  } ],
  html_gesendet: String
});

const ConfigSchema = new mongoose.Schema({
  active: Boolean,
  themen: [],
  separat: [],
  email: String,
  separat_archiv: []
})

ConfigSchema.method('archiveSeparat', function(entscheidNr, callback) {
  const separat = this.separat.filter( nr => {
    if ( nr === entscheidNr ) return false;
    return true;
  })
  console.log(separat);
  let separat_archiv = [...this.separat_archiv];
  separat_archiv.push(entscheidNr);
  console.log(this);
  Object.assign(
    this,
    { separat: [...separat] },
    { separat_archiv: [...separat_archiv] }
  );
  console.log(this);
  this.save(callback);
});

const Log = mongoose.model('Log', LogSchema);
const Day = mongoose.model('Day', DaySchema);
const Config = mongoose.model('Config', ConfigSchema);

module.exports.Log = Log;
module.exports.Day = Day;
module.exports.Config = Config;
