import { Schema, model } from 'mongoose';

const LogSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  gefundene_tage: [],
});

const MailLogSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  error: String,
  reply: String,
});

const DecisionSubSchema = new Schema({
  nr: String,
  leitentscheid: Boolean,
  thema: String,
  beschreibung: String,
});
const DaySchema = new Schema({
  datum: String,
  url: String,
  entscheide_separat: [DecisionSubSchema],
  entscheide_interessant: [DecisionSubSchema],
  entscheide_restliche: [DecisionSubSchema],
  html_gesendet: String,
});

const DetailSearchSchema = new Schema({
  ausgabe: String,
  suche: [String],
});
const ConfigSchema = new Schema({
  active: Boolean,
  themen: [],
  separat: [],
  email: [],
  separat_archiv: [],
  detailsuche: [DetailSearchSchema],
});

ConfigSchema.method('archiveSeparat', function (archivieren, callback) {
  const separat = this.separat.filter((nr) => {
    if (archivieren.indexOf(nr) >= 0) return false;
    return true;
  });
  const separat_archiv = [...this.separat_archiv].concat(archivieren);
  Object.assign(
    this,
    { separat: [...separat] },
    { separat_archiv: [...separat_archiv] },
  );
  this.save(callback);
});

export const Log = model('Log', LogSchema);
export const MailLog = model('MailLog', MailLogSchema);
export const Day = model('Day', DaySchema);
export const Config = model('Config', ConfigSchema);
