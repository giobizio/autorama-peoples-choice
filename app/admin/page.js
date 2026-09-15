'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

const ADMIN_PASSWORD = 'autorama2026'
const LOGIN_KEY = 'autorama_admin_login'
const LOGIN_DURATION = 24 * 60 * 60 * 1000

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [checkingLogin, setCheckingLogin] = useState(true)
  const [results, setResults] = useState([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const savedLogin = localStorage.getItem(LOGIN_KEY)

    if (savedLogin) {
      const loginTime = Number(savedLogin)
      const now = Date.now()

      if (now - loginTime < LOGIN_DURATION) {
        setLoggedIn(true)
        loadResults()
      } else {
        localStorage.removeItem(LOGIN_KEY)
      }
    }

    setCheckingLogin(false)
  }, [])

  async function loadResults() {
    setMessage('Caricamento risultati...')

    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('id,name')
      .eq('active', true)
      .order('id')

    const { data: voteResults, error: votesError } = await supabase
      .rpc('get_vote_results')

    if (carsError || votesError) {
      console.error('Cars error:', carsError)
      console.error('Votes error:', votesError)
      setMessage('Errore nel caricamento dei risultati.')
      return
    }

    const counts = {}

    for (const row of voteResults || []) {
      counts[row.car_id] = Number(row.vote_count)
    }

    const finalResults = (cars || [])
      .map((car) => ({
        ...car,
        votes: counts[car.id] || 0
      }))
      .sort((a, b) => {
        if (b.votes !== a.votes) {
          return b.votes - a.votes
        }

        return a.id - b.id
      })

    const total = (voteResults || []).reduce(
      (sum, row) => sum + Number(row.vote_count),
      0
    )

    setResults(finalResults)
    setTotalVotes(total)
    setMessage('')
  }

  function login() {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(LOGIN_KEY, Date.now().toString())

      setLoggedIn(true)
      setPassword('')
      setMessage('')
      loadResults()
    } else {
      setMessage('Password errata.')
    }
  }

  function logout() {
    localStorage.removeItem(LOGIN_KEY)
    setLoggedIn(false)
    setResults([])
    setTotalVotes(0)
    setMessage('')
  }

  async function resetVotes() {
    const enteredPassword = window.prompt(
      'Inserisci nuovamente la password Admin per azzerare tutti i voti:'
    )

    if (enteredPassword === null) {
      return
    }

    if (!enteredPassword) {
      window.alert('Password non inserita.')
      return
    }

    const confirmed = window.confirm(
      'ATTENZIONE: stai per cancellare TUTTI i voti. Questa operazione non può essere annullata.\n\nSei sicuro di voler continuare?'
    )

    if (!confirmed) {
      return
    }

    setMessage('Azzeramento voti in corso...')

    const { data, error } = await supabase.rpc('reset_all_votes', {
      p_password: enteredPassword
    })

    if (error) {
      console.error('Reset error:', error)
      setMessage('Errore durante l’azzeramento dei voti.')
      return
    }

    if (data === 'wrong_password') {
      setMessage('Password errata. I voti NON sono stati cancellati.')
      return
    }

    if (data === 'ok') {
      await loadResults()
      window.alert('Tutti i voti sono stati azzerati.')
    }
  }

  if (checkingLogin) {
    return (
      <main style={styles.page}>
        <div style={styles.loginBox}>
          <div style={styles.kicker}>AUTORAMA 2026</div>
          <div style={styles.message}>Caricamento...</div>
        </div>
      </main>
    )
  }

  if (!loggedIn) {
    return (
      <main style={styles.page}>
        <div style={styles.loginBox}>
          <div style={styles.kicker}>AUTORAMA 2026</div>

          <h1 style={styles.title}>ADMIN</h1>

          <p style={styles.text}>
            Inserisci la password per visualizzare i risultati.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') login()
            }}
            placeholder="Password"
            style={styles.input}
          />

          <button onClick={login} style={styles.button}>
            ACCEDI
          </button>

          {message && (
            <div style={styles.message}>
              {message}
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.kicker}>AUTORAMA 2026</div>

        <h1 style={styles.title}>RISULTATI</h1>

        <div style={styles.total}>
          VOTI TOTALI: {totalVotes}
        </div>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        {results.map((car, index) => {
          const percentage =
            totalVotes > 0
              ? ((car.votes / totalVotes) * 100).toFixed(1)
              : '0.0'

          return (
            <div key={car.id} style={styles.result}>
              <div>
                <div style={styles.position}>
                  {index + 1}° — #{String(car.id).padStart(2, '0')}
                </div>

                <div style={styles.carName}>
                  {car.name}
                </div>
              </div>

              <div style={styles.voteCount}>
                {car.votes}

                <span style={styles.voteLabel}>
                  {' '}voti
                </span>

                <div style={styles.percentage}>
                  {percentage}%
                </div>
              </div>
            </div>
          )
        })}

        <button
          onClick={loadResults}
          style={styles.refresh}
        >
          AGGIORNA RISULTATI
        </button>

        <button
          onClick={resetVotes}
          style={styles.reset}
        >
          AZZERA TUTTI I VOTI
        </button>

        <button
          onClick={logout}
          style={styles.logout}
        >
          ESCI DALL&apos;ADMIN
        </button>
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
    padding: '40px 18px'
  },

  container: {
    maxWidth: 700,
    margin: '0 auto'
  },

  loginBox: {
    maxWidth: 450,
    margin: '80px auto',
    textAlign: 'center'
  },

  kicker: {
    textAlign: 'center',
    letterSpacing: 4,
    color: '#aaaaaa',
    fontSize: 14
  },

  title: {
    textAlign: 'center',
    fontSize: 46,
    margin: '12px 0 20px'
  },

  text: {
    color: '#cccccc',
    lineHeight: 1.5
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 16,
    marginTop: 15,
    background: '#171717',
    color: '#ffffff',
    border: '1px solid #444444',
    borderRadius: 10,
    fontSize: 18
  },

  button: {
    width: '100%',
    padding: 16,
    marginTop: 12,
    border: 0,
    borderRadius: 10,
    background: '#ffffff',
    color: '#000000',
    fontSize: 18,
    fontWeight: 900
  },

  message: {
    marginTop: 18,
    marginBottom: 18,
    textAlign: 'center'
  },

  total: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 900,
    marginBottom: 30
  },

  result: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#171717',
    border: '1px solid #333333',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12
  },

  position: {
    color: '#aaaaaa',
    fontSize: 15
  },

  carName: {
    fontSize: 21,
    fontWeight: 900,
    marginTop: 4
  },

  voteCount: {
    textAlign: 'right',
    fontSize: 26,
    fontWeight: 900
  },

  voteLabel: {
    fontSize: 14,
    color: '#aaaaaa'
  },

  percentage: {
    fontSize: 14,
    color: '#aaaaaa',
    marginTop: 3
  },

  refresh: {
    width: '100%',
    padding: 16,
    marginTop: 22,
    border: 0,
    borderRadius: 10,
    background: '#ffffff',
    color: '#000000',
    fontWeight: 900,
    fontSize: 16
  },

  reset: {
    width: '100%',
    padding: 16,
    marginTop: 12,
    border: '2px solid #ff4444',
    borderRadius: 10,
    background: '#2a1010',
    color: '#ff6666',
    fontWeight: 900,
    fontSize: 16
  },

  logout: {
    width: '100%',
    padding: 15,
    marginTop: 12,
    border: '1px solid #555555',
    borderRadius: 10,
    background: '#171717',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: 15
  }
}
