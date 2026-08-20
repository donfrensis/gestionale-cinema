import { config } from 'dotenv'
config({ path: '.env.local' })

const API_KEY = process.env.MAILCHIMP_API_KEY
const BASE = 'https://us4.api.mailchimp.com/3.0'
const HEADERS = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
}

const TEMPLATES = [
  { id: 10102234, name: '1 film' },
  { id: 10102527, name: '2 film' },
]

for (const tpl of TEMPLATES) {
  console.log(`\n=== Template ${tpl.name} (${tpl.id}) ===`)

  const res = await fetch(`${BASE}/templates/${tpl.id}/default-content`, { headers: HEADERS })
  const data = await res.json()
  let html = data.html

  html = html.replace('id="d4"', 'id="d4" mc:edit="intro"')
  html = html.replace('id="d5"', 'id="d5" mc:edit="film_sx"')
  html = html.replace('id="d7"', 'id="d7" mc:edit="film_dx"')

  if (!html.includes('mc:edit="intro"'))   console.warn('⚠️  d4 non trovato!')
  if (!html.includes('mc:edit="film_sx"')) console.warn('⚠️  d5 non trovato!')
  if (!html.includes('mc:edit="film_dx"')) console.warn('⚠️  d7 non trovato!')

  const patch = await fetch(`${BASE}/templates/${tpl.id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ html })
  })
  console.log(`PATCH status: ${patch.status}`)
}

// Test campaign draft sul template 1 film
console.log('\n=== Test campaign draft ===')
const campaign = await fetch(`${BASE}/campaigns`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify({
    type: 'regular',
    recipients: { list_id: 'fbdc5dac4b' },
    settings: {
      subject_line: 'TEST mc:edit - cancellare',
      title: 'TEST mc:edit - cancellare',
      from_name: 'Cinema Everest Galluzzo',
      reply_to: 'programmazione@everestgalluzzo.it',
      template_id: 10102234
    }
  })
})
const c = await campaign.json()
console.log(`Campaign id: ${c.id}, web_id: ${c.web_id}`)

const content = await fetch(`${BASE}/campaigns/${c.id}/content`, {
  method: 'PUT',
  headers: HEADERS,
  body: JSON.stringify({
    template: {
      id: 10102234,
      sections: {
        intro: '<p style="text-align:center"><strong>TEST INTRO</strong></p>',
        film_sx: '<p>TEST POSTER</p>',
        film_dx: '<p>TEST FILM INFO</p>'
      }
    }
  })
})
console.log(`Content PUT status: ${content.status}`)
console.log(`Verifica su: https://mc.us4.mailchimp.com/campaigns/edit?id=${c.web_id}`)
