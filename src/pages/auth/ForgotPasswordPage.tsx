import { useState } from 'react'
import {
  IonPage, IonContent, IonInput, IonButton, IonText, IonSpinner
} from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { resetPasswordForEmail } from '../../services/supabase'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError(t('forgot_password_email_empty'))
      return
    }
    setLoading(true)
    setError('')
    const { error: authError } = await resetPasswordForEmail(email)
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setSent(true)
  }

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': 'var(--pep-purple-pale)' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--pep-purple)', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
            }}>
              🔑
            </div>
            <h2 style={{ margin: 0, color: 'var(--pep-purple)', fontWeight: 700, fontSize: 22 }}>
              {t('forgot_password_title')}
            </h2>
            <p style={{ color: 'var(--pep-text-light)', fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
              {t('forgot_password_subtitle')}
            </p>
          </div>

          {sent ? (
            <div className="pep-card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, margin: '0 0 12px' }}>✅</p>
              <IonText color="success">
                <p style={{ fontWeight: 600, fontSize: 15 }}>{t('forgot_password_sent')}</p>
              </IonText>
            </div>
          ) : (
            <div className="pep-card">
              <IonInput
                label={t('login_email')}
                labelPlacement="floating"
                type="email"
                value={email}
                onIonInput={e => setEmail(e.detail.value ?? '')}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ marginBottom: 8 }}
              />

              {error && (
                <IonText color="danger">
                  <p style={{ fontSize: 13, margin: '4px 0 8px' }}>{error}</p>
                </IonText>
              )}

              <IonButton
                expand="block"
                onClick={handleSend}
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: 16 }}
              >
                {loading ? <IonSpinner name="crescent" /> : t('forgot_password_btn')}
              </IonButton>
            </div>
          )}

          <p
            style={{ textAlign: 'center', marginTop: 24, color: 'var(--pep-purple)', cursor: 'pointer', fontSize: 14 }}
            onClick={() => history.replace('/login')}
          >
            {t('forgot_password_back')}
          </p>
        </div>
      </IonContent>
    </IonPage>
  )
}
