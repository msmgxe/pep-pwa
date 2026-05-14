import { useState } from 'react'
import {
  IonPage, IonContent, IonInput, IonButton, IonText, IonSpinner, IonIcon
} from '@ionic/react'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { signIn } from '../../services/supabase'

export default function LoginPage() {
  const { t } = useTranslation()
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!email) return t('login_email_empty')
    if (!/\S+@\S+\.\S+/.test(email)) return t('login_email_invalid')
    if (!password) return t('login_password_empty')
    if (password.length < 6) return t('login_password_short')
    return ''
  }

  const handleLogin = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')
    const { error: authError } = await signIn(email, password)
    setLoading(false)
    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('email not confirmed')) {
        setError('Confirma tu correo antes de iniciar sesión.')
      } else {
        setError('Correo o contraseña incorrectos.')
      }
      return
    }
    history.replace('/')
  }

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': 'var(--pep-purple-pale)' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--pep-purple)', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: '#fff', fontSize: 36, fontWeight: 700 }}>P</span>
            </div>
            <h1 style={{ margin: 0, color: 'var(--pep-purple)', fontSize: 26, fontWeight: 700 }}>
              {t('app_name')}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--pep-text-light)', fontSize: 14 }}>
              {t('app_subtitle')}
            </p>
          </div>

          <div className="pep-card">
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
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ marginBottom: 8 }}
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

            {error && (
              <IonText color="danger">
                <p style={{ fontSize: 13, margin: '4px 0 8px' }}>{error}</p>
              </IonText>
            )}

            <IonButton
              expand="block"
              onClick={handleLogin}
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: 16 }}
            >
              {loading ? <IonSpinner name="crescent" /> : t('login_btn')}
            </IonButton>
          </div>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
            <span
              style={{ color: 'var(--pep-purple)', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => history.push('/forgot-password')}
            >
              {t('forgot_password_link')}
            </span>
          </p>

          <p style={{ textAlign: 'center', marginTop: 8, color: 'var(--pep-text-light)', fontSize: 14 }}>
            {t('login_no_account')}
            <span
              style={{ color: 'var(--pep-purple)', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => history.push('/register')}
            >
              {t('login_register_link')}
            </span>
          </p>
        </div>
      </IonContent>
    </IonPage>
  )
}
