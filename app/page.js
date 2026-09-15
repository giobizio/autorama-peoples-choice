'use client'
// Autorama 2026
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

function getVoterId() {
  let id = localStorage.getItem('autorama_voter_id')

  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('autorama_voter_id', id)
  }

  return id
}

export default function Home() {
  const [cars, setCars] = useState([])
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  const [voted, setVoted] = useState(false)
  const [email, setEmail] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  useEffect(() => {
    loadCars()
  }, [])

  async function loadCars() {
    const { data, error } = await supabase
      .from('cars')
      .select('id,name,photo_url')
      .eq('active', true)
      .order('id')

    if (error) {
      setMessage('Errore nel caricamento delle auto.')
      return
    }

    setCars(data || [])
  }

  async function vote() {
    if (!selected) {
      setMessage('Seleziona prima la tua auto preferita.')
      return
    }

    const voterId = getVoterId()

    const { data, error } = await supabase.rpc('submit_vote', {
      p_car_id: selected,
      p_voter_id: voterId
    })

    if (error) {
      setMessage('Errore durante il voto. Riprova.')
      return
    }

    if (data === 'already_voted') {
      setMessage('Hai già votato da questo dispositivo.')
      setVoted(true)
      return
    }

    if (data === 'ok') {
      setMessage('Voto registrato!')
      setVoted(true)
    }
  }

  async function saveEmail() {
    if (!email) return

    const { data, error } = await supabase.rpc('register_result_email', {
      p_email: email
    })

    if (error || data === 'invalid_email') {
      setEmailMessage('Inserisci un indirizzo e-mail valido.')
      return
    }

    setEmailMessage('Perfetto! Ti comunicheremo il risultato.')
    setEmail('')
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.kicker}>AUTORAMA 2026</div>

        <h1 style={styles.title}>PEOPLE&apos;S CHOICE</h1>

        <p style={styles.subtitle}>
          Vota la tua auto preferita
        </p>

        <div style={styles.grid}>
          {cars.map((car) => (
            <button
              key={car.id}
              onClick={() => !voted && setSelected(car.id)}
              style={{
                ...styles.card,
                ...(selected === car.id ? styles.selectedCard : {})
              }}
            >
              <div style={styles.imageBox}>
                {car.photo_url ? (
                  <img
                    src={car.photo_url}
                    alt={car.name}
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.placeholder}>
                    FOTO
                  </div>
                )}

                <div style={styles.number}>
                  #{String(car.id).padStart(2, '0')}
                </div>
              </div>

              <div style={styles.carName}>{car.name}</div>
            </button>
          ))}
        </div>

        {!voted && (
          <button
            onClick={vote}
            disabled={!selected}
            style={{
              ...styles.voteButton,
              opacity: selected ? 1 : 0.4
            }}
          >
            VOTA
          </button>
        )}

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        {voted && (
          <section style={styles.emailSection}>
            <h2 style={styles.emailTitle}>
              Vuoi sapere quale auto ha vinto?
            </h2>

            <p style={styles.emailText}>
              Lascia la tua e-mail e ti comunicheremo il risultato della
              People&apos;s Choice dopo la premiazione.
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="La tua e-mail"
              style={styles.input}
            />

            <button onClick={saveEmail} style={styles.emailButton}>
              AVVISAMI DEL RISULTATO
            </button>

            {emailMessage && (
              <div style={styles.emailMessage}>
                {emailMessage}
              </div>
            )}
          </section>
        )}
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
    padding: '28px 14px 60px'
  },

  container: {
    maxWidth: 900,
    margin: '0 auto'
  },

  kicker: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 14,
    color: '#aaaaaa',
    marginTop: 12
  },

  title: {
    textAlign: 'center',
    fontSize: 'clamp(34px, 9vw, 68px)',
    lineHeight: 0.95,
    margin: '14px 0 10px'
  },

  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 32
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14
  },

  card: {
    padding: 0,
    background: '#171717',
    border: '2px solid #292929',
    borderRadius: 14,
    overflow: 'hidden',
    color: '#ffffff',
    textAlign: 'left',
    cursor: 'pointer'
  },

  selectedCard: {
    border: '3px solid #ffffff',
    transform: 'scale(1.02)'
  },

  imageBox: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    background: '#222222'
  },

  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },

  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666666',
    fontSize: 22,
    fontWeight: 'bold'
  },

  number: {
    position: 'absolute',
    top: 10,
    left: 10,
    background: '#ffffff',
    color: '#000000',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 18,
    fontWeight: 900
  },

  carName: {
    padding: '12px 12px 14px',
    fontWeight: 800,
    fontSize: 17
  },

  voteButton: {
    width: '100%',
    marginTop: 28,
    padding: '18px 20px',
    fontSize: 22,
    fontWeight: 900,
    border: 0,
    borderRadius: 12,
    background: '#ffffff',
    color: '#000000'
  },

  message: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 700
  },

  emailSection: {
    marginTop: 34,
    padding: 22,
    background: '#171717',
    borderRadius: 16
  },

  emailTitle: {
    marginTop: 0,
    fontSize: 26
  },

  emailText: {
    color: '#cccccc',
    lineHeight: 1.5
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '15px',
    marginTop: 10,
    background: '#0b0b0b',
    color: '#ffffff',
    border: '1px solid #444444',
    borderRadius: 10,
    fontSize: 16
  },

  emailButton: {
    width: '100%',
    padding: '15px',
    marginTop: 12,
    border: 0,
    borderRadius: 10,
    background: '#ffffff',
    color: '#000000',
    fontWeight: 900,
    fontSize: 16
  },

  emailMessage: {
    marginTop: 14,
    textAlign: 'center'
  }
}
