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

    if (voting) return

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
              opacity: selected && !voting ? 1 : 0.4
            }}
          >
            {voting ? 'REGISTRAZIONE...' : 'VOTA'}
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
    background: '#080808',
    color: '#ffffff',
    fontFamily: 'Arial, Helvetica, sans-serif',
    padding: '70px 24px 80px'
  },

  container: {
    width: '100%',
    maxWidth: '760px',
    margin: '0 auto',
    textAlign: 'center'
  },

  kicker: {
    fontSize: '20px',
    letterSpacing: '8px',
    color: '#aaaaaa',
    marginBottom: '22px'
  },

  title: {
    margin: 0,
    fontSize: '56px',
    lineHeight: 1,
    fontWeight: '900',
    letterSpacing: '-1px'
  },

  subtitle: {
    marginTop: '30px',
    marginBottom: '64px',
    fontSize: '28px',
    color: '#cccccc'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '26px',
    alignItems: 'start'
  },

  card: {
    width: '100%',
    padding: 0,
    margin: 0,
    border: '3px solid #292929',
    borderRadius: '24px',
    overflow: 'hidden',
    background: '#151515',
    color: '#ffffff',
    textAlign: 'left',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    boxSizing: 'border-box'
  },

  selectedCard: {
    border: '3px solid #ffffff',
    boxShadow: '0 0 0 3px rgba(255,255,255,0.18)'
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
    background: '#222222',
    color: '#777777',
    fontSize: '24px'
  },

  number: {
    position: 'absolute',

    // NUMERO DI GARA:
    // 8 px dal bordo sinistro e dal bordo inferiore
    left: '8px',
    bottom: '8px',

    padding: '5px 10px',
    borderRadius: '10px',
    background: 'rgba(0, 0, 0, 0.72)',
    border: '2px solid rgba(255, 255, 255, 0.75)',
    color: '#ffffff',
    fontSize: '24px',
    lineHeight: 1,
    fontWeight: '900',
    letterSpacing: '0.5px'
  },

  carName: {
    padding: '24px 22px 26px',
    fontSize: '28px',
    lineHeight: 1.25,
    fontWeight: '800',
    color: '#ffffff'
  },

  voteButton: {
    width: '100%',
    marginTop: '56px',
    padding: '26px 20px',
    border: 'none',
    borderRadius: '22px',
    background: '#ffffff',
    color: '#000000',
    fontSize: '32px',
    fontWeight: '900',
    cursor: 'pointer'
  },

  alreadyVotedBox: {
    marginTop: '56px',
    padding: '34px 24px',
    border: '3px solid #ffffff',
    borderRadius: '24px',
    background: '#151515',
    textAlign: 'center'
  },

  stopIcon: {
    width: '52px',
    height: '52px',
    margin: '0 auto 18px',
    borderRadius: '50%',
    background: '#ffffff',
    color: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '34px',
    fontWeight: '900'
  },

  alreadyVotedTitle: {
    fontSize: '30px',
    fontWeight: '900'
  },

  alreadyVotedSubtitle: {
    marginTop: '5px',
    fontSize: '20px',
    fontWeight: '800',
    color: '#cccccc'
  },

  alreadyVotedText: {
    marginTop: '20px',
    fontSize: '18px',
    lineHeight: 1.5,
    color: '#bbbbbb'
  },

  message: {
    marginTop: '30px',
    fontSize: '18px',
    color: '#ffffff'
  }
}
