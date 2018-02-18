# BGer-watch

**Zweck:** Neu veröffentlichte Urteile auf der Seite des Schweizer Bundesgerichts suchen, diese nach Thema filtern und per Mail versenden.

**Node.js App** (wird durch Cron job gestartet)

- cheerio: einschlägige Passage im HTML herausfiltern
- sendmail
- mongoose: Anbindung MongoDB

**MongoDB**

- Konfiguration
- Urteile (Meta-Daten)
- Log