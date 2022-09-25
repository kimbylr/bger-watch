import iconv from 'iconv-lite';
import { Config } from './db-models';

const returnRegExOrNull = (arr: any[]) => {
  if (arr.length === 0) {
    return null;
  }

  return new RegExp(arr.join('|'), 'i');
};

export const getConfig = async () => {
  const config = await Config.findOne({ active: true });

  if (!config) {
    console.log('Keine aktive Konfiguration gefunden!');
    throw new Error();
  }

  const urteileSeparat = returnRegExOrNull(config.separat);
  const themenSeparat = returnRegExOrNull(config.themen); // case-insensitive substrings
  const detailSearch = config.detailsuche
    .map(({ suche, ausgabe }) => ({
      regEx: returnRegExOrNull(suche) as RegExp, // anticipating subsequent filtering
      output: ausgabe || suche[0],
    }))
    .filter(({ regEx }) => !!regEx);

  return { config, urteileSeparat, themenSeparat, detailSearch };
};

export const handleUmlauts = async (res: Response) =>
  iconv.decode(Buffer.from(await res.arrayBuffer()), 'cp1252'); // cp1252 = ISO-8859-1 = Latin 1
