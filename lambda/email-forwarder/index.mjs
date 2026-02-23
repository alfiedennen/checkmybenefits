import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses'

const s3 = new S3Client({})
const ses = new SESClient({ region: 'eu-west-1' })

const FORWARD_TO = process.env.FORWARD_TO
const EMAIL_BUCKET = process.env.EMAIL_BUCKET

export async function handler(event) {
  const record = event.Records[0]
  const messageId = record.ses.mail.messageId
  const originalFrom = record.ses.mail.source
  const originalTo = record.ses.mail.destination[0]

  console.log(`Forwarding email ${messageId} from ${originalFrom} to ${FORWARD_TO}`)

  // Fetch raw email from S3
  const { Body } = await s3.send(new GetObjectCommand({
    Bucket: EMAIL_BUCKET,
    Key: messageId,
  }))
  let rawEmail = await Body.transformToString()

  // Rewrite headers for forwarding
  // Set From to the receiving address (so SES allows sending) with original sender info
  // Set Reply-To to the original sender so replies go back to them
  rawEmail = rawEmail
    .replace(/^From: .+$/m, `From: ${originalTo}`)
    .replace(/^To: .+$/m, `To: ${FORWARD_TO}`)
    .replace(/^Return-Path: .+$/m, `Return-Path: ${FORWARD_TO}`)

  // Add Reply-To if not present, or replace it
  if (/^Reply-To: /m.test(rawEmail)) {
    rawEmail = rawEmail.replace(/^Reply-To: .+$/m, `Reply-To: ${originalFrom}`)
  } else {
    rawEmail = rawEmail.replace(/^From: /m, `Reply-To: ${originalFrom}\nFrom: `)
  }

  // Prepend original sender info to Subject
  rawEmail = rawEmail.replace(
    /^Subject: (.+)$/m,
    `Subject: [Fwd from ${originalFrom}] $1`
  )

  // Remove DKIM signature — it will be invalid after header changes
  rawEmail = rawEmail.replace(/^DKIM-Signature: [\s\S]*?(?=^\S)/m, '')

  await ses.send(new SendRawEmailCommand({
    RawMessage: { Data: Buffer.from(rawEmail) },
    Destinations: [FORWARD_TO],
    Source: originalTo,
  }))

  console.log(`Forwarded ${messageId} to ${FORWARD_TO}`)
  return { status: 'ok' }
}
