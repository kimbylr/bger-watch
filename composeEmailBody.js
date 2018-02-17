composeEmailBody = ( themen, entscheide_separat, entscheide_interessant, entscheide_restliche ) => {
  // (1) separat auszuweisende urteile
  let emailBody = '';
  if ( entscheide_separat.length > 0 ) {
    entscheide_separat.forEach( ({ nr, thema, leitentscheid, beschreibung }) => {
      emailBody = emailBody + `<strong>=== many wait for, such has appeared ===</strong><br/><br/><strong><a href="https://bger.li/${nr}">${nr}</a>: ${thema}</strong>
      ${ leitentscheid ? ' <span style=\"color: red\">(Leitentscheid)</span>' : '' }
      <br/>${beschreibung}
      <br/><br/><br/>`

      // TODO: aus config löschen
    });
  }

  // (2) gewählte themen
  emailBody = emailBody + `<strong>=== Urteile zu gewählten Themen ===</strong><br/>${themen.join(', ')}<br/><br/>`;
  if ( entscheide_interessant.length === 0 ) {
    emailBody = emailBody + 'Keine Urteile zu den gewählten Themen.<br/><br/>'
  } else {
    entscheide_interessant.forEach( ({ nr, thema, leitentscheid, beschreibung }) => {
      emailBody = emailBody + `<strong><a href="https://bger.li/${nr}">${nr}</a>: ${thema}</strong>
      ${ leitentscheid ? ' <span style=\"color: red\">(Leitentscheid)</span>' : '' }
      <br/>${beschreibung}
      <br/><br/>`
    });
  }

  // (3) weitere urteile
  emailBody = emailBody + '<br/><br/><br/><strong>=== weitere Urteile ===</strong><br/><br>';

  if ( entscheide_restliche.length === 0 ) {
    emailBody = emailBody + 'Keine weiteren Urteile.'
  } else {
    entscheide_restliche.forEach( ({ nr, thema, leitentscheid, beschreibung }) => {
      emailBody = emailBody + `<strong><a href="https://bger.li/${nr}">${nr}</a>: ${thema}</strong>
      ${ leitentscheid ? ' <span style=\"color: red\">(Leitentscheid)</span>' : '' }
      <br/>${beschreibung}
      <br/><br/>`
    });
  }

  return emailBody;
}

module.exports = composeEmailBody;
