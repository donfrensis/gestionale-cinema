import { config } from 'dotenv'
config({ path: '.env.local' })

const API_KEY = process.env.MAILCHIMP_API_KEY
const TEMPLATE_ID = process.env.MAILCHIMP_TEMPLATE_ID
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
  body, #bodyTable { background-color: #FAFAFA; margin: 0; padding: 0; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; }
  table { border-collapse: collapse; } td, p, div { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; }
  img { border: 0; height: auto; }
  @media only screen and (max-width: 480px) {
    .col50 { display: block !important; width: 100% !important; }
  }
</style>
</head>
<body>
<span style="display:none;font-size:1px;color:#FAFAFA;max-height:0;max-width:0;opacity:0;overflow:hidden;">*|MC_PREVIEW_TEXT|*</span>
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

const patch = await fetch(`${BASE}/templates/${TEMPLATE_ID}`, {
  method: 'PATCH',
  headers: HEADERS,
  body: JSON.stringify({ html })
})
console.log(`PATCH status: ${patch.status}`)
if (!patch.ok) console.error(await patch.text())
else console.log('Font aggiornato correttamente')
