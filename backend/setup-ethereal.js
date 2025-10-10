import nodemailer from 'nodemailer'

async function createTestAccount() {
  try {
    const account = await nodemailer.createTestAccount()
    console.log('Ethereal test account created:')
    console.log('SMTP_HOST=smtp.ethereal.email')
    console.log('SMTP_PORT=587')
    console.log('SMTP_SECURE=false')
    console.log(`SMTP_USER=${account.user}`)
    console.log(`SMTP_PASS=${account.pass}`)
    console.log(`MAIL_FROM="DocuVault <${account.user}>"`)
    console.log('\nAdd these to your backend/.env file')
  } catch (err) {
    console.error('Failed to create test account:', err)
  }
}

createTestAccount()
