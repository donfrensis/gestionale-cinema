import { config } from 'dotenv'
config({ path: '.env.local' })

const BASE = 'https://us4.api.mailchimp.com/3.0'
const H = {
  'Authorization': `Bearer ${process.env.MAILCHIMP_API_KEY}`,
  'Content-Type': 'application/json',
}

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  console.log(`${method} ${path} → ${res.status}`)
  if (!res.ok) console.error('ERROR:', JSON.stringify(json, null, 2))
  return { status: res.status, body: json }
}

// Step 1: crea template con mc:edit="test"
console.log('=== STEP 1: POST /templates ===')
const { body: tpl } = await call('POST', '/templates', {
  name: 'TEST mc:edit - cancellare',
  html: '<html><body><div mc:edit="test">placeholder</div></body></html>',
})
const templateId = tpl.id
console.log(`Template id: ${templateId}`)

// Step 2: crea campaign con quel template
console.log('\n=== STEP 2: POST /campaigns ===')
const { body: c } = await call('POST', '/campaigns', {
  type: 'regular',
  recipients: { list_id: process.env.MAILCHIMP_AUDIENCE_ID },
  settings: {
    subject_line: 'TEST sections - cancellare',
    title: 'TEST sections - cancellare',
    from_name: 'Cinema Everest Galluzzo',
    reply_to: 'programmazione@everestgalluzzo.it',
    template_id: templateId,
  },
})
const campaignId = c.id
console.log(`Campaign id: ${campaignId}, web_id: ${c.web_id}`)

// Step 3: imposta contenuto via template.sections
console.log('\n=== STEP 3: PUT /campaigns/{id}/content ===')
await call('PUT', `/campaigns/${campaignId}/content`, {
  template: {
    id: templateId,
    sections: {
      test: '<p>HELLO</p>',
    },
  },
})

console.log(`\nVerifica: https://mc.us4.mailchimp.com/campaigns/edit?id=${c.web_id}`)
console.log('Ricorda di eliminare template e campaign dal pannello Mailchimp.')
