export const metadata = {
  title: "Autorama 2026 - People's Choice",
  description: "Vota la tua auto preferita all'Autorama 2026"
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
