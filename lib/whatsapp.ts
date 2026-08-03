export async function sendWhatsApp(phone: string, firstName: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: process.env.WHATSAPP_TEMPLATE_NAME ?? 'eden_broadcast',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: firstName || 'Beloved' },
                  { type: 'text', text: message },
                ],
              },
            ],
          },
        }),
      }
    )
    return res.ok
  } catch {
    return false
  }
}
