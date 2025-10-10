import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true })
})

// POST /email/share
// Body: { to, subject, text, html }
app.post('/email/share', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body || {}
    if (!to) return res.status(400).json({ error: 'Missing to' })

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Boolean(process.env.SMTP_SECURE === 'true'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: subject || 'Document share',
      text: text || '',
      html: html || undefined
    })

    res.json({ id: info.messageId })
  } catch (err) {
    console.error('Failed to send email', err)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Email service running on :${port}`)
})


