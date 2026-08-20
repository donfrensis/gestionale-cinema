import { config } from 'dotenv'
config({ path: '.env.local' })

const API_KEY = process.env.MAILCHIMP_API_KEY
const BASE = 'https://us4.api.mailchimp.com/3.0'
const HEADERS = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
}

const LOGO_URL = 'https://mcusercontent.com/1ed73b2160efc6b9b2a887777/images/16cf26d6-55c5-d894-5eba-0cc8717621fb.jpeg'

const html = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body, #bodyTable { background-color: #FAFAFA; margin: 0; padding: 0; }
  table { border-collapse: collapse; }
  img { border: 0; height: auto; }
  @media only screen and (max-width: 480px) {
    .col50 { display: block !important; width: 100% !important; }
  }
</style>
</head>
<body>
<center>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FAFAFA">
<tr><td align="center">
<table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px">

  <!-- LOGO -->
  <tr><td align="center" style="padding:9px 18px">
    <img src="${LOGO_URL}" width="480" style="display:block;max-width:100%;height:auto">
  </td></tr>

  <!-- INTRO -->
  <tr><td style="padding:7px 18px">
    <div mc:edit="intro">
      <p style="text-align:center;margin:0">
        <strong><span style="color:rgb(0,0,205);font-size:20px">programmazione</span></strong><br>
        <span style="font-size:14px">Potete trovare le nostre schede di lettura di ogni film cliccando su</span><br>
        Ci vediamo al 📽🏔🐓 !!! Buona giornata!
      </p>
    </div>
  </td></tr>

  <!-- FILM COLUMNS -->
  <tr><td style="padding:7px 0">
    <table border="0" cellpadding="0" cellspacing="20" width="100%">
    <tr>
      <td valign="top" class="col50" width="50%" style="padding:0">
        <div mc:edit="film_sx">
          <p style="text-align:center">poster / film 1</p>
        </div>
      </td>
      <td valign="top" class="col50" width="50%" style="padding:0">
        <div mc:edit="film_dx">
          <p style="text-align:center">info film / film 2</p>
        </div>
      </td>
    </tr>
    </table>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:18px 0">
    <table width="100%"><tr>
      <td style="border-top:2px solid #EAEAEA;font-size:0;line-height:0">&nbsp;</td>
    </tr></table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td align="center" style="padding:9px 18px;background-color:#FAFAFA">
    <table border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:3px 14px">
        <a href="https://www.facebook.com/teatro.everestfirenze/" target="_blank">
          <img src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-facebook-48.png" width="24" height="24">
        </a>
      </td>
      <td style="padding:3px 14px">
        <a href="https://www.instagram.com/cinemaeverestgalluzzo/" target="_blank">
          <img src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-instagram-48.png" width="24" height="24">
        </a>
      </td>
    </tr>
    </table>
    <p style="font-size:12px;color:#666;text-align:center;margin:16px 0 4px">
      <strong>Cinema Teatro Everest</strong><br>
      Via Volteranna, 4 - Firenze 50124 FI<br>
      tel: 055 2321754<br>
      <a href="mailto:programmazione@everestgalluzzo.it">programmazione@everestgalluzzo.it</a>
    </p>
    <p style="font-size:12px;color:#666;text-align:center;margin:8px 0">
      Vuoi cambiare come ricevi queste email?<br>
      Puoi <a href="*|UPDATE_PROFILE|*">aggiornare le preferenze</a> o
      <a href="*|UNSUB|*">disiscriverti dalla lista</a>.
    </p>
    <a href="http://eepurl.com/jo3iEQ" target="_blank">
      <img src="https://cdn-images.mailchimp.com/monkey_rewards/intuit-mc-rewards-1.png" width="137" height="53">
    </a>
  </td></tr>

</table>
</td></tr>
</table>
</center>
</body></html>`

// POST template
const tplRes = await fetch(`${BASE}/templates`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify({ name: 'newsletter-cinema', html })
})
const tpl = await tplRes.json()
console.log(`Template creato: id=${tpl.id}, status=${tplRes.status}`)
if (!tpl.id) { console.error(tpl); process.exit(1) }

// Test campaign
const campRes = await fetch(`${BASE}/campaigns`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify({
    type: 'regular',
    recipients: { list_id: 'fbdc5dac4b' },
    settings: {
      subject_line: 'TEST newsletter-cinema template - cancellare',
      title: 'TEST newsletter-cinema template - cancellare',
      from_name: 'Cinema Everest Galluzzo',
      reply_to: 'programmazione@everestgalluzzo.it',
      template_id: tpl.id
    }
  })
})
const camp = await campRes.json()
console.log(`Campaign creata: web_id=${camp.web_id}`)

// Popola sezioni
const contentRes = await fetch(`${BASE}/campaigns/${camp.id}/content`, {
  method: 'PUT',
  headers: HEADERS,
  body: JSON.stringify({
    template: {
      id: tpl.id,
      sections: {
        intro: '<p style="text-align:center"><strong><span style="color:rgb(0,0,205);font-size:20px">programmazione 23-27 aprile</span></strong><br><span style="font-size:14px">Potete trovare le nostre schede di lettura di ogni film cliccando su</span><br>Ci vediamo al 📽🏔🐓 !!! Buona giornata!</p>',
        film_sx: '<p style="text-align:center"><img src="https://cinema.everestgalluzzo.it/posters/test.jpg" style="width:175px;height:auto"></p>',
        film_dx: '<p style="text-align:center;color:rgb(0,0,205)"><strong>TITOLO FILM</strong></p><p style="text-align:center"><em>di Regista</em></p><p style="text-align:center;font-family:Courier New,monospace;color:rgb(0,0,205)"><strong>gio 24 - ore 21.15</strong></p>'
      }
    }
  })
})
console.log(`Content status: ${contentRes.status}`)
console.log(`Verifica: https://mc.us4.mailchimp.com/campaigns/edit?id=${camp.web_id}`)
console.log(`\nAggiungi a .env.local:\nMAILCHIMP_TEMPLATE_ID=${tpl.id}`)
