const BASE_URL = `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`
const TEMPLATE_ID = parseInt(process.env.MAILCHIMP_TEMPLATE_ID || '0')

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.MAILCHIMP_API_KEY}`,
  'Content-Type': 'application/json',
})

export async function createMailchimpDraft(params: {
  subject: string
  previewText: string
  sections: { intro: string; film_sx: string; film_dx: string }
}): Promise<{ id: string; webId: number; archiveUrl: string }> {
  const createRes = await fetch(`${BASE_URL}/campaigns`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      type: 'regular',
      recipients: { list_id: process.env.MAILCHIMP_AUDIENCE_ID },
      settings: {
        subject_line: params.subject,
        preview_text: params.previewText,
        title: params.subject,
        from_name: 'Cinema Everest Galluzzo',
        reply_to: 'programmazione@everestgalluzzo.it',
        template_id: TEMPLATE_ID,
      },
    }),
  })

  if (!createRes.ok) {
    const body = await createRes.text()
    throw new Error(`Mailchimp: creazione campagna fallita (${createRes.status}): ${body}`)
  }

  const campaign = await createRes.json()
  const campaignId: string = campaign.id
  const webId: number = campaign.web_id
  const archiveUrl: string = campaign.archive_url

  const contentRes = await fetch(`${BASE_URL}/campaigns/${campaignId}/content`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      template: {
        id: TEMPLATE_ID,
        sections: {
          intro: params.sections.intro,
          film_sx: params.sections.film_sx,
          film_dx: params.sections.film_dx,
        },
      },
    }),
  })

  if (!contentRes.ok) {
    const body = await contentRes.text()
    throw new Error(`Mailchimp: impostazione contenuto fallita (${contentRes.status}): ${body}`)
  }

  return { id: campaignId, webId, archiveUrl }
}
