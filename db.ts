import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const { DB_HOST, DB_USER, DB_PASS } = process.env;

export const connectToDB = () =>
  new Promise<void>((res) => {
    mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASS}@${DB_HOST}`);

    const db = mongoose.connection;

    db.on('error', (error) => {
      console.error('DB connection error', error);
      throw new Error();
    });

    db.once('open', (error) => {
      if (error) {
        console.error('DB connection failed', error);
        throw new Error();
      }

      console.log('DB connection successful');

      res();
    });
  });
