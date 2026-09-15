import type { Metadata } from 'next'
import { Montserrat, Poppins } from 'next/font/google'
import StaleDeploymentBanner from '@/components/StaleDeploymentBanner'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Eden Life Academy',
  description: 'Discipleship platform for Eden Life Experience Centre with courses, daily devotionals, sermons, Bible study, and certificates.',
  openGraph: {
    title: 'Eden Life Academy',
    description: 'Discipleship platform for Eden Life Experience Centre with courses, daily devotionals, sermons, Bible study, and certificates.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${poppins.variable}`}>
        {/* Admin-only diagnostic: lights up when the build being served is not
            the build this page was compiled from (stale Vercel promotion). */}
        <StaleDeploymentBanner />
        {children}
      </body>
    </html>
  )
}
