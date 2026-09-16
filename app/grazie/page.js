'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

export default function GraziePage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveEmail() {
    if (!email) {
      setMessage('Inserisci il tuo indirizzo e-mail.')
      return
    }

    setSending(true)
    setMessage('')

    const { data, error } = await supabase.rpc(
      'register_result_email',
      {
        p_email: email
      }
    )

    setSending(false)

    if (error || data === 'invalid_email') {
      setMessage('Inserisci un indirizzo e-mail valido.')
      return
    }

    setSaved(true)
    setEmail('')
    setMessage(
      'Perfetto! Ti comunicheremo il risultato dopo la premiazione.'
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.kicker}>
          AUTORAMA 2026
        </div>

        <div style={styles.check}>
          ✓
        </div>

        <h1 style={styles.title}>
          VOTO REGISTRATO!
        </h1>

        {!saved ? (
          <>
            <h2 style={styles.question}>
              Vuoi sapere quale auto ha vinto?
            </h2>

            <p style={styles.text}>
              Lascia la tua e-mail e ti comunicheremo
              il risultato della People&apos;s Choice
              dopo la premiazione.
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveEmail()
                }
              }}
              placeholder="La tua e-mail"
              style={styles.input}
            />

            <button
              onClick={saveEmail}
              disabled={sending}
              style={{
                ...styles.button,
                opacity: sending ? 0.5 : 1
              }}
            >
              {sending
                ? 'SALVATAGGIO...'
                : 'AVVISAMI DEL RISULTATO'}
            </button>
          </>
        ) : (
          <div style={styles.successBox}>
            E-MAIL REGISTRATA ✓
          </div>
        )}

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        <div style={styles.thanks}>
          Grazie per aver partecipato!
        </div>

      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0b0b0b',
    color: '#ffffff',
    fontFamily: 'Arial, Helvetica, sans-serif',
    padding: '45px 18px'
  },

  container: {
    maxWidth: 600,
    margin: '0 auto',
    textAlign: 'center'
  },

  kicker: {
    letterSpacing: 4,
    fontSize: 14,
    color: '#aaaaaa',
    marginTop: 20
  },

  check: {
    width: 76,
    height: 76,
    margin: '45px auto 22px',
    border: '3px solid #ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 42,
    fontWeight: 900
  },

  title: {
    fontSize: 'clamp(36px, 10vw, 58px)',
    lineHeight: 1,
    margin: '0 0 45px',
    fontWeight: 900
  },

  question: {
    fontSize: 27,
    lineHeight: 1.15,
    marginBottom: 14
  },

  text: {
    color: '#cccccc',
    fontSize: 17,
    lineHeight: 1.5,
    marginBottom: 24
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 17,
    background: '#171717',
    color: '#ffffff',
    border: '1px solid #444444',
    borderRadius: 10,
    fontSize: 17
  },

  button: {
    width: '100%',
    padding: 17,
    marginTop: 12,
    border: 0,
    borderRadius: 10,
    background: '#ffffff',
    color: '#000000',
    fontWeight: 900,
    fontSize: 16
  },

  successBox: {
    padding: 22,
    background: '#171717',
    border: '1px solid #444444',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 900
  },

  message: {
    marginTop: 18,
    color: '#cccccc',
    fontSize: 16,
    lineHeight: 1.4
  },

  thanks: {
    marginTop: 45,
    color: '#777777',
    fontSize: 14
  }
}
