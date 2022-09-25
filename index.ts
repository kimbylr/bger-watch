import express from 'express';
import dotenv from 'dotenv';
import { run } from './run';

dotenv.config();
const SECRET = process.env.ENDPOINT_SECRET || 'secret';

const app = express();
const PORT = process.env.PORT || 4004;
const server = app.listen(PORT, () =>
  console.log(`${Date()}\nListening on port ${PORT}.`),
);

app.get('/run', async (req, res) => {
  if (req.query.p !== SECRET) {
    res.sendStatus(403);
  } else {
    await run();
    res.sendStatus(200);
  }

  server.close();
});
