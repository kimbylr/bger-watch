import fetch from 'cross-fetch';
import { handleUmlauts } from './helpers';

export const mapDecisions = async (
  rows: any,
  detailSearch: { regEx: RegExp; output: string }[],
) => {
  const decisions: any[] = [];

  for (let j = 1; j < rows.length; j += 2) {
    const cols = rows[j].children.filter(({ type }: any) => type === 'tag'); // nur die 5 <td>s
    const thema = cols[4].children[0].children[0].data;
    const entscheidNr = cols[2].children[0].children[0].data;
    const entscheidUrl = cols[2].children[0].attribs.href;
    const leitentscheid = thema.search(/\*/) >= 0;
    const beschreibung = rows[j + 1].children.filter(
      ({ type }) => type === 'tag',
    )[4].children[0].data;

    decisions.push({
      nr: entscheidNr,
      url: entscheidUrl,
      leitentscheid,
      beschreibung,
      thema,
    });
  }

  const details = await Promise.all(
    decisions.map(({ url }) => performDetailSearch(url, detailSearch)),
  );

  return decisions.map((d, i) => ({ ...d, details: details[i] }));
};

const performDetailSearch = async (
  url: string,
  detailSearch: { regEx: RegExp; output: string }[],
) => {
  const res = await fetch(url);
  if (!res.ok) {
    return 'Suche in Urteilsseite fehlgeschlagen.';
  }

  const body = await handleUmlauts(res);
  return detailSearch
    .filter(({ regEx }) => regEx.test(body))
    .map(({ output }) => output)
    .join('; ');
};

export const sortDecisions = ({
  entscheide,
  themenSeparat,
  urteileSeparat,
}: {
  entscheide: any;
  themenSeparat: RegExp | null;
  urteileSeparat: RegExp | null;
}) => {
  const decisions: Record<string, any[]> = {
    separat: [],
    interessant: [],
    restliche: [],
  };

  entscheide.forEach((entscheid) => {
    if (urteileSeparat?.test(entscheid.entscheidNr)) {
      // (1) urteil erwartet -> separat ausweisen
      decisions.separat.push(entscheid);
    } else if (themenSeparat?.test(entscheid.thema)) {
      // (2) thema von interesse
      decisions.interessant.push(entscheid);
    } else {
      // (3) restliche urteile
      decisions.restliche.push(entscheid);
    }
  });

  return decisions;
};
