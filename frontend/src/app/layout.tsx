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
    <html lang="en">
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
              background: 'hsl(0 0% 100%)',
              color: 'hsl(30 5% 18%)',
              border: '1px solid hsl(42 9% 82%)',
              borderRadius: '0.75rem',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#265a0c', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
