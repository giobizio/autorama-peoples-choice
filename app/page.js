'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const warningRef = useRef(null)

  const [cars, setCars] = useState([])
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  const [alreadyVoted, setAlreadyVoted] = useState(false)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    loadCars()
  }, [])

  useEffect(() => {
    if (alreadyVoted && warningRef.current) {
      warningRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [alreadyVoted])

  async function loadCars() {
    const { data, error } = await supabase
      .from('cars')
      .select('id,name,photo_url,display_number')
      .eq('active', true)

    if (error) {
      setMessage('Errore nel caricamento delle auto.')
      return
    }

    const sortedCars = (data || []).sort((a, b) => {
      const aHasNumber = a.display_number !== null
      const bHasNumber = b.display_number !== null

      if (aHasNumber && bHasNumber) {
        return a.display_number - b.display_number
      }

      if (aHasNumber) return -1
      if (bHasNumber) return 1

      return a.id - b.id
    })

    setCars(sortedCars)
  }

  async function vote() {
    if (!selected) {
      setMessage('Seleziona prima la tua auto preferita.')
      return
    }

    if (voting) {
      return
    }

    setVoting(true)
    setMessage('')
    setAlreadyVoted(false)

    const voterId = getVoterId()

    const { data, error } = await supabase.rpc('submit_vote', {
      p_car_id: selected,
      p_voter_id: voterId
    })

    if (error) {
      setVoting(false)
      setMessage('Errore durante il voto. Riprova.')
      return
    }

    if (data === 'already_voted') {
      setVoting(false)
      setAlreadyVoted(true)
      setSelected(null)
      return
    }

    if (data === 'ok') {
      router.push('/grazie')
      return
    }

    setVoting(false)
    setMessage('Errore durante il voto. Riprova.')
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.kicker}>
          AUTORAMA 2026
        </div>

        <h1 style={styles.title}>
          PEOPLE&apos;S CHOICE
        </h1>

        <p style={styles.subtitle}>
          Vota la tua auto preferita
        </p>

        <div style={styles.grid}>
          {cars.map((car) => (
            <button
              key={car.id}
              onClick={() => {
                if (!voting && !alreadyVoted) {
                  setSelected(car.id)
                  setMessage('')
                }
              }}
              style={{
                ...styles.card,
                ...(selected === car.id
                  ? styles.selectedCard
                  : {})
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

                {car.display_number !== null && (
                  <div style={styles.number}>
                    #{String(car.display_number).padStart(2, '0')}
                  </div>
                )}

              </div>

              <div style={styles.carName}>
                {car.name}
              </div>

            </button>
          ))}
        </div>

        {!alreadyVoted && (
          <button
            onClick={vote}
            disabled={!selected || voting}
            style={{
              ...styles.voteButton,
              opacity:
                selected && !voting
                  ? 1
                  : 0.4
            }}
          >
            {voting
              ? 'REGISTRAZIONE...'
              : 'VOTA'}
          </button>
        )}

        {alreadyVoted && (
          <div
            ref={warningRef}
            style={styles.alreadyVotedBox}
          >

            <div style={styles.stopIcon}>
              !
            </div>

            <div style={styles.alreadyVotedTitle}>
              HAI GIÀ VOTATO
            </div>

            <div style={styles.alreadyVotedSubtitle}>
              DA QUESTO DISPOSITIVO
            </div>

            <div style={styles.alreadyVotedText}>
              Grazie per aver partecipato!
              <br />
              È consentito un solo voto per dispositivo.
            </div>

          </div>
        )}

        {message && (
          <div style={styles.message}>
            {message}
          </div>
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
    aspectRatio: '1500 / 1150',
    background: '#222222',
    overflow: 'hidden'
  },

  image: {
    width: '100%',
    height: '100%',
    objectFit: 'fill',
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
    bottom: 3,
    right: 3,
    background: 'rgba(0, 0, 0, 0.72)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: 6,
    padding: '4px 7px',
    fontSize: 15,
    fontWeight: 900,
    lineHeight: 1
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

  alreadyVotedBox: {
    marginTop: 30,
    padding: '25px 18px',
    background: '#2a1010',
    border: '2px solid #ff4444',
    borderRadius: 16,
    textAlign: 'center',
    scrollMargin: '80px 0'
  },

  stopIcon: {
    width: 55,
    height: 55,
    margin: '0 auto 15px',
    border: '3px solid #ff5555',
    borderRadius: '50%',
    color: '#ff5555',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 34,
    fontWeight: 900
  },

  alreadyVotedTitle: {
    color: '#ff5555',
    fontSize: 'clamp(28px, 8vw, 42px)',
    lineHeight: 1,
    fontWeight: 900
  },

  alreadyVotedSubtitle: {
    color: '#ffffff',
    fontSize: 'clamp(19px, 5vw, 27px)',
    fontWeight: 900,
    marginTop: 8
  },

  alreadyVotedText: {
    color: '#cccccc',
    fontSize: 16,
    lineHeight: 1.5,
    marginTop: 18
  },

  message: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 700
  }
}
