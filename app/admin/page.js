'use client'

import { useEffect, useState } from 'react'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [checkingLogin, setCheckingLogin] = useState(true)
  const [results, setResults] = useState([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [message, setMessage] = useState('')
  const [votingOpen, setVotingOpen] = useState(null)
  const [changingVoting, setChangingVoting] = useState(false)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const response = await fetch('/api/admin-session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      })

      if (response.ok) {
        setLoggedIn(true)
        await loadResults()
        await loadVotingStatus()
      } else {
        setLoggedIn(false)
      }
    } catch (error) {
      console.error('Session error:', error)
      setLoggedIn(false)
    }

    setCheckingLogin(false)
  }

  async function loadResults() {
    setMessage('Caricamento risultati...')

    try {
      const response = await fetch('/api/admin-results', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      })

      if (response.status === 401) {
        setLoggedIn(false)
        setResults([])
        setTotalVotes(0)
        setMessage('Sessione scaduta. Effettua nuovamente l’accesso.')
        return
      }

      const data = await response.json()

      if (!response.ok || !data.ok) {
        setMessage('Errore nel caricamento dei risultati.')
        return
      }

      setResults(data.results || [])
      setTotalVotes(data.totalVotes || 0)
      setMessage('')
    } catch (error) {
      console.error('Results error:', error)
      setMessage('Errore nel caricamento dei risultati.')
    }
  }

  async function loadVotingStatus() {
    try {
      const response = await fetch('/api/admin-voting', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      })

      if (response.status === 401) {
        setLoggedIn(false)
        setVotingOpen(null)
        setMessage('Sessione scaduta. Effettua nuovamente l’accesso.')
        return
      }

      const data = await response.json()

      if (!response.ok || !data.ok) {
        setVotingOpen(null)
        setMessage('Errore nel caricamento dello stato delle votazioni.')
        return
      }

      setVotingOpen(data.votingOpen)
    } catch (error) {
      console.error('Voting status error:', error)
      setVotingOpen(null)
      setMessage('Errore nel caricamento dello stato delle votazioni.')
    }
  }

  async function changeVotingStatus() {
    if (votingOpen === null || changingVoting) {
      return
    }

    const newStatus = !votingOpen

    const confirmed = window.confirm(
      newStatus
        ? 'Vuoi APRIRE le votazioni?'
        : 'Vuoi CHIUDERE le votazioni?'
    )

    if (!confirmed) {
      return
    }

    setChangingVoting(true)
    setMessage(
      newStatus
        ? 'Apertura votazioni in corso...'
        : 'Chiusura votazioni in corso...'
    )

    try {
      const response = await fetch('/api/admin-voting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          votingOpen: newStatus
        })
      })

      if (response.status === 401) {
        setLoggedIn(false)
        setVotingOpen(null)
        setMessage('Sessione scaduta. Effettua nuovamente l’accesso.')
        setChangingVoting(false)
        return
      }

      const data = await response.json()

      if (!response.ok || !data.ok) {
        setMessage('Errore durante la modifica dello stato delle votazioni.')
        setChangingVoting(false)
        return
      }

      setVotingOpen(data.votingOpen)
      setMessage('')
      setChangingVoting(false)
    } catch (error) {
      console.error('Voting update error:', error)
      setMessage('Errore durante la modifica dello stato delle votazioni.')
      setChangingVoting(false)
    }
  }

  async function login() {
    if (!password) {
      setMessage('Inserisci la password.')
      return
    }

    setMessage('Accesso in corso...')

    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          password
        })
      })

      if (response.status === 401) {
        setMessage('Password errata.')
        return
      }

      if (!response.ok) {
        setMessage('Errore durante l’accesso.')
        return
      }

      setLoggedIn(true)
      setPassword('')
      setMessage('')

      await loadResults()
      await loadVotingStatus()
    } catch (error) {
      console.error('Login error:', error)
      setMessage('Errore durante l’accesso.')
    }
  }

  async function logout() {
    try {
      await fetch('/api/admin-login', {
        method: 'DELETE',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }

    setLoggedIn(false)
    setResults([])
    setTotalVotes(0)
    setVotingOpen(null)
    setPassword('')
    setMessage('')
  }

  async function resetVotes() {
    const confirmed = window.confirm(
      'ATTENZIONE: stai per cancellare TUTTI i voti. Questa operazione non può essere annullata.\n\nSei sicuro di voler continuare?'
    )

    if (!confirmed) {
      return
    }

    setMessage('Azzeramento voti in corso...')

    try {
      const response = await fetch('/api/admin-reset', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.status === 401) {
        setLoggedIn(false)
        setResults([])
        setTotalVotes(0)
        setMessage('Sessione scaduta. Effettua nuovamente l’accesso.')
        return
      }

      const data = await response.json()

      if (!response.ok || !data.ok) {
        setMessage('Errore durante l’azzeramento dei voti.')
        return
      }

      await loadResults()
      window.alert('Tutti i voti sono stati azzerati.')
    } catch (error) {
      console.error('Reset error:', error)
      setMessage('Errore durante l’azzeramento dei voti.')
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

        <div
          style={{
            ...styles.votingStatus,
            ...(votingOpen === true
              ? styles.votingOpen
              : votingOpen === false
                ? styles.votingClosed
                : {})
          }}
        >
          STATO VOTAZIONI:{' '}
          {votingOpen === true
            ? 'APERTE'
            : votingOpen === false
              ? 'CHIUSE'
              : 'CARICAMENTO...'}
        </div>

        <button
          onClick={changeVotingStatus}
          disabled={votingOpen === null || changingVoting}
          style={{
            ...styles.votingButton,
            ...(votingOpen === true
              ? styles.closeVotingButton
              : styles.openVotingButton),
            opacity:
              votingOpen === null || changingVoting
                ? 0.5
                : 1
          }}
        >
          {changingVoting
            ? 'ATTENDI...'
            : votingOpen === true
              ? 'CHIUDI VOTAZIONI'
              : 'APRI VOTAZIONI'}
        </button>

        {message && (
          <div style={styles.errorMessage}>
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

  errorMessage: {
    marginTop: 18,
    marginBottom: 18,
    padding: 14,
    background: '#2a1010',
    border: '1px solid #ff4444',
    borderRadius: 10,
    color: '#ff8888',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: 'break-word'
  },

  total: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 900,
    marginBottom: 30
  },

  votingStatus: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 18,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 12
  },

  votingOpen: {
    background: '#102a18',
    border: '2px solid #3bd66f',
    color: '#69e891'
  },

  votingClosed: {
    background: '#2a1010',
    border: '2px solid #ff4444',
    color: '#ff6666'
  },

  votingButton: {
    width: '100%',
    padding: 16,
    marginBottom: 30,
    borderRadius: 10,
    fontWeight: 900,
    fontSize: 16
  },

  closeVotingButton: {
    border: '2px solid #ff4444',
    background: '#2a1010',
    color: '#ff6666'
  },

  openVotingButton: {
    border: '2px solid #3bd66f',
    background: '#102a18',
    color: '#69e891'
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
