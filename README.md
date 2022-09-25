# BGer-watch v2 (2022)

Scrapes page of Swiss Bundesgericht (federal high court), parses new decisions, filters them by subject and sends an email summary.

## Overview

**Node.js App** (wird durch Cron job gestartet)

- cheerio: einschlägige Passage im HTML herausfiltern
- sendet Mail via sendgrid
- legt Mail, bearbeitete Tage und Logs in MongoDB ab

**MongoDB**

- Konfiguration
- Urteile (Meta-Daten)
- Logs

## Setup

Config files:

- app.yaml.dist => app.yaml (gcloud)
- cron.yaml.dist => cron.yaml (gcloud)
- .env.dist => .env (local)

`npm i && npm run dev`
