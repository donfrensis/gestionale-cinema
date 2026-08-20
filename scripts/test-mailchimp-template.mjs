import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
const envVars = {}
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const idx = trimmed.indexOf('=')
  if (idx === -1) continue
  const key = trimmed.slice(0, idx).trim()
  const val = trimmed.slice(idx + 1).trim()
  envVars[key] = val
}

const API_KEY = envVars.MAILCHIMP_API_KEY
const AUDIENCE_ID = envVars.MAILCHIMP_AUDIENCE_ID
const SERVER = envVars.MAILCHIMP_SERVER_PREFIX
const BASE_URL = `https://${SERVER}.api.mailchimp.com/3.0`
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
}

async function call(method, path, body) {
  const url = `${BASE_URL}${path}`
  console.log(`\n--- ${method} ${url}`)
  if (body) console.log('body:', JSON.stringify(body, null, 2))

  const res = await fetch(url, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let parsed
  try { parsed = JSON.parse(text) } catch { parsed = text }

  console.log(`status: ${res.status}`)
  console.log('response:', JSON.stringify(parsed, null, 2))
  return { status: res.status, body: parsed }
}

// Step 1: list templates
console.log('=== STEP 1: Lista template ===')
const { body: tplList } = await call('GET', '/templates?type=user')
const userTemplates = tplList.templates ?? []
console.log('\nTemplate utente trovati:')
userTemplates.forEach(t => console.log(`  id=${t.id}  name="${t.name}"`))

const templateId = userTemplates[0]?.id
if (!templateId) {
  console.log('\nNessun template utente trovato, esco.')
  process.exit(1)
}
console.log(`\nUso template id=${templateId} per il test`)

// Step 2: create campaign with template_id
console.log('\n=== STEP 2: Crea campagna con template_id ===')
const { body: campaign } = await call('POST', '/campaigns', {
  type: 'regular',
  recipients: { list_id: AUDIENCE_ID },
  settings: {
    subject_line: 'TEST - cancellare',
    title: 'TEST - cancellare',
    from_name: 'Cinema Everest Galluzzo',
    reply_to: 'programmazione@everestgalluzzo.it',
    template_id: templateId,
  },
})

const campaignId = campaign.id
if (!campaignId) {
  console.log('\nCreazione campagna fallita, esco.')
  process.exit(1)
}
console.log(`\nCampagna creata: id=${campaignId}`)

// Step 3: set content via template + sections
console.log('\n=== STEP 3: Imposta contenuto con template.sections ===')
await call('PUT', `/campaigns/${campaignId}/content`, {
  template: {
    id: templateId,
    sections: {
      header: '<p>TEST SEZIONE</p>',
    },
  },
})

console.log('\n=== FINE ===')
console.log(`Campagna di test creata: https://mc.us4.mailchimp.com/campaigns/edit?id=${campaign.web_id}`)
console.log('Ricordati di eliminarla dal pannello Mailchimp.')
