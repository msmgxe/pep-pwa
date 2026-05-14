import { useState } from 'react'
import {
  IonPage, IonContent, IonInput, IonButton, IonText, IonSpinner, IonIcon
} from '@ionic/react'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { signUp } from '../../services/supabase'
import { setLanguage } from '../../i18n'

const LANGS = [
  { code: 'es', label: 'Español', flag: '🇲🇽' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
] as const

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const history = useHistory()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedLang = i18n.language as 'es' | 'en' | 'pt'

  const validate = () => {
    if (!fullName.trim()) return t('register_fullname_empty')
    if (!email) return t('login_email_empty')
    if (!/\S+@\S+\.\S+/.test(email)) return t('login_email_invalid')
    if (!password) return t('register_password_empty')
    if (password.length < 6) return t('login_password_short')
    if (password !== confirm) return t('register_password_mismatch')
    return ''
  }

  const handleRegister = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')
    const { error: authError } = await signUp(email, password, fullName.trim())
    setLoading(false)
    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('rate limit')) {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.')
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        history.replace('/login')
      } else {
        setError(authError.message)
      }
      return
    }
    history.push('/otp', { email })
  }

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': 'var(--pep-purple-pale)' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 48 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--pep-purple)', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: '#fff', fontSize: 36, fontWeight: 700 }}>P</span>
            </div>
            <h1 style={{ margin: 0, color: 'var(--pep-purple)', fontSize: 26, fontWeight: 700 }}>
              {t('register_title')}
            </h1>
          </div>

          {/* Selector de idioma */}
          <div className="pep-card" style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--pep-text-light)' }}>
              {t('profile_language')}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {LANGS.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  style={{
                    flex: 1, padding: '10px 4px', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: selectedLang === lang.code ? 'var(--pep-purple)' : 'var(--pep-purple-pale)',
                    color: selectedLang === lang.code ? '#fff' : 'var(--pep-purple)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{lang.flag}</div>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <div className="pep-card">
            <IonInput
              label={t('register_fullname')}
              labelPlacement="floating"
              type="text"
              autocapitalize="words"
              value={fullName}
              onIonInput={e => setFullName(e.detail.value ?? '')}
              style={{ marginBottom: 12 }}
            />
            <IonInput
              label={t('login_email')}
              labelPlacement="floating"
              type="email"
              value={email}
              onIonInput={e => setEmail(e.detail.value ?? '')}
              style={{ marginBottom: 12 }}
            />
            <IonInput
              label={t('login_password')}
              labelPlacement="floating"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onIonInput={e => setPassword(e.detail.value ?? '')}
              style={{ marginBottom: 12 }}
            >
              <IonButton
                slot="end"
                fill="clear"
                size="small"
                onClick={() => setShowPassword(s => !s)}
                style={{ '--color': 'var(--pep-text-light)' }}
              >
                <IonIcon slot="icon-only" icon={showPassword ? eyeOffOutline : eyeOutline} />
              </IonButton>
            </IonInput>
            <IonInput
              label={t('register_confirm_password')}
              labelPlacement="floating"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onIonInput={e => setConfirm(e.detail.value ?? '')}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
            >
              <IonButton
                slot="end"
                fill="clear"
                size="small"
                onClick={() => setShowConfirm(s => !s)}
                style={{ '--color': 'var(--pep-text-light)' }}
              >
                <IonIcon slot="icon-only" icon={showConfirm ? eyeOffOutline : eyeOutline} />
              </IonButton>
            </IonInput>

            {error && (
              <IonText color="danger">
                <p style={{ fontSize: 13, margin: '4px 0 8px' }}>{error}</p>
              </IonText>
            )}

            <IonButton
              expand="block"
              onClick={handleRegister}
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: 16 }}
            >
              {loading ? <IonSpinner name="crescent" /> : t('register_btn')}
            </IonButton>
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--pep-text-light)', fontSize: 14 }}>
            {t('register_has_account')}
            <span
              style={{ color: 'var(--pep-purple)', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => history.replace('/login')}
            >
              {t('register_login_link')}
            </span>
          </p>
        </div>
      </IonContent>
    </IonPage>
  )
}
