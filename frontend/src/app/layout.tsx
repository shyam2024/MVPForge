import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'GenAI Assistant — Build Software with AI',
  description: 'Transform your idea into a production-ready software project through a 7-stage AI pipeline.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(222 47% 7%)',
              color: 'hsl(213 31% 91%)',
              border: '1px solid hsl(216 34% 17%)',
              borderRadius: '0.75rem',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#6271f1', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
