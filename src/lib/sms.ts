/**
 * SMS sending stub — ready for Twilio integration.
 *
 * TODO: Replace this stub with real Twilio when ready:
 *   1. npm install twilio
 *   2. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER to .env.local
 *   3. Replace the console.warn below with:
 *      const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
 *      await client.messages.create({ body, from: process.env.TWILIO_FROM_NUMBER, to })
 */
export async function sendSms(to: string, body: string): Promise<void> {
  // TODO: Integrate Twilio here — see instructions above
  console.warn(`[SMS STUB] Would text ${to}: "${body}"`)
}
