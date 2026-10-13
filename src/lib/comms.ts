import { Resend } from 'resend'

interface SendOtpEmailParams {
  to: string
  otp: string
  purpose: 'LOGIN' | 'FORGOT_PASSWORD' | 'VERIFY_CONTACT'
  name?: string
}

interface SendOtpSmsParams {
  mobile: string
  otp: string
  purpose: 'LOGIN' | 'FORGOT_PASSWORD' | 'VERIFY_CONTACT'
}

/**
 * Sends a luxury-styled OTP email via Resend
 */
export async function sendOtpEmail({ to, otp, purpose, name = 'Valued Patron' }: SendOtpEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const sender = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  const purposeText = {
    LOGIN: 'Sign In Verification',
    FORGOT_PASSWORD: 'Password Reset Request',
    VERIFY_CONTACT: 'Email Address Verification',
  }[purpose] || 'Verification Code'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Hema's Boutique - Verification Code</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 40px 20px; color: #2C2420;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #F0E4D8; overflow: hidden; box-shadow: 0 10px 30px rgba(138, 26, 56, 0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #8A1A38 0%, #B82E54 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-family: Georgia, serif; font-size: 26px; margin: 0; letter-spacing: 0.5px;">Hema&apos;s Boutique</h1>
              <p style="color: #F8D7DA; font-size: 11px; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 2px;">Women&apos;s Tex Valley &bull; Pure Artisanal Luxury</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="font-size: 18px; color: #3C1824; margin: 0 0 12px; font-weight: 600;">${purposeText}</h2>
              <p style="font-size: 14px; color: #6E5A50; line-height: 1.6; margin: 0 0 24px;">
                Namaste ${name},<br>
                Use the following 6-digit One-Time Password (OTP) to complete your ${purposeText.toLowerCase()} on Hema's Boutique.
              </p>
              
              <div style="background-color: #FDFBF7; border: 2px dashed #E5D5C5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #8A1A38; font-family: monospace;">${otp}</span>
                <p style="margin: 8px 0 0; font-size: 12px; color: #9E887C;">Valid for 10 minutes &bull; Do not share this code with anyone</p>
              </div>

              <p style="font-size: 12px; color: #8C786E; line-height: 1.5; margin: 0;">
                If you did not request this OTP, you can safely disregard this email. Your royal account remains secure.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F8F4EE; padding: 20px; text-align: center; border-top: 1px solid #EFE5D9;">
              <p style="font-size: 11px; color: #9A877C; margin: 0;">
                &copy; ${new Date().getFullYear()} Hema&apos;s Boutique, Tex Valley. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  console.log(`\n==================================================`)
  console.log(`[OTP EMAIL DISPATCH] To: ${to} | Purpose: ${purpose} | OTP: ${otp}`)
  console.log(`==================================================\n`)

  if (!apiKey) {
    console.warn('[COMMS] RESEND_API_KEY is not set. Logged OTP in console for development.')
    return { success: true, messageId: 'simulated_dev_id' }
  }

  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: sender,
      to,
      subject: `Your Hema's Boutique OTP: ${otp} (${purposeText})`,
      html,
    })

    if (result.error) {
      console.warn('[COMMS] Resend send warning:', result.error.message)
      // Fallback for domain restrictions: if sender failed, try onboarding@resend.dev
      if (sender !== 'onboarding@resend.dev') {
        try {
          const retry = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to,
            subject: `Your Hema's Boutique OTP: ${otp} (${purposeText})`,
            html,
          })
          if (!retry.error) {
            return { success: true, messageId: retry.data?.id }
          }
        } catch {
          // ignore retry error
        }
      }
      return { success: false, error: result.error.message }
    }

    return { success: true, messageId: result.data?.id }
  } catch (err: any) {
    console.error('[COMMS] Email dispatch error:', err?.message || err)
    return { success: false, error: err?.message || 'Failed to dispatch email' }
  }
}

/**
 * Sends an OTP SMS via MSG91
 */
export async function sendOtpSms({ mobile, otp, purpose }: SendOtpSmsParams): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY
  const templateId = process.env.MSG91_TEMPLATE_ID

  console.log(`\n==================================================`)
  console.log(`[OTP SMS DISPATCH] Mobile: ${mobile} | Purpose: ${purpose} | OTP: ${otp}`)
  console.log(`==================================================\n`)

  if (!authKey) {
    console.warn('[COMMS] MSG91_AUTH_KEY is not configured. Logged OTP in console for development.')
    return { success: true, requestId: 'simulated_sms_dev' }
  }

  try {
    // Sanitize mobile: remove +, spaces, dashes. Ensure country code 91 for India if missing
    let cleanMobile = mobile.replace(/[^0-9]/g, '')
    if (cleanMobile.length === 10) {
      cleanMobile = `91${cleanMobile}`
    }

    const url = new URL('https://control.msg91.com/api/v5/otp')
    url.searchParams.set('authkey', authKey)
    url.searchParams.set('mobile', cleanMobile)
    url.searchParams.set('otp', otp)
    if (templateId) {
      url.searchParams.set('template_id', templateId)
    }

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp,
      }),
    })

    const data = await res.json()
    if (data.type === 'error' || res.status >= 400) {
      console.warn('[COMMS] MSG91 response warning:', data.message || data.msg || data)
      return { success: false, error: data.message || data.msg || 'MSG91 delivery failure' }
    }

    return { success: true, requestId: data.request_id || data.message }
  } catch (err: any) {
    console.error('[COMMS] MSG91 SMS error:', err?.message || err)
    return { success: false, error: err?.message || 'Failed to send SMS' }
  }
}
