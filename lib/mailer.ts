import nodemailer from 'nodemailer'

// Strip spaces from app password in case it was copied with spaces (e.g. "xxxx xxxx xxxx xxxx")
const appPassword = (process.env.GMAIL_APP_PASSWORD ?? '').replace(/\s/g, '')

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: appPassword,
  },
})

export const FROM = `Eden Life Academy <${process.env.GMAIL_USER}>`
export const FROM_GLOBAL = `Edenlife Global <${process.env.GMAIL_USER}>`
