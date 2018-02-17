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

const Log = mongoose.model('Log', LogSchema);
const Day = mongoose.model('Day', DaySchema);

module.exports.Log = Log;
module.exports.Day = Day;
