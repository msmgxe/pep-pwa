import { useState, useEffect } from 'react'
import {
  IonPage, IonContent, IonButton, IonText, IonSpinner, IonInput
} from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { verifyOtp, resendOtp } from '../../services/supabase'

const RESEND_COOLDOWN = 300

export default function OTPPage() {
  const { t } = useTranslation()
  const history = useHistory()
  const location = useLocation<{ email?: string }>()
  const email = location.state?.email ?? ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleVerify = async () => {
    if (code.length !== 6) { setError('Ingresa el código de 6 dígitos'); return }
    setLoading(true)
    setError('')
    const { error: otpError } = await verifyOtp(email, code)
    setLoading(false)
    if (otpError) { setError(otpError.message); return }
    history.replace('/')
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setResending(true)
    setResendMsg('')
    setError('')
    const { error: resendError } = await resendOtp(email)
    setResending(false)
    if (resendError) { setError(resendError.message); return }
    setResendMsg('Código reenviado. Revisa tu correo.')
    setCountdown(RESEND_COOLDOWN)
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
              fontSize: 32
            }}>
              ✉️
            </div>
            <h2 style={{ margin: 0, color: 'var(--pep-purple)', fontWeight: 700 }}>{t('otp_title')}</h2>
            <p style={{ color: 'var(--pep-text-light)', fontSize: 14, marginTop: 8 }}>
              {t('otp_subtitle', { email })}
            </p>
          </div>

          <div className="pep-card">
            <IonInput
              label="Código"
              labelPlacement="floating"
              type="number"
              inputmode="numeric"
              maxlength={6}
              value={code}
              onIonInput={e => setCode(e.detail.value ?? '')}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              style={{ letterSpacing: 8, fontSize: 24, textAlign: 'center' }}
            />

            {error && (
              <IonText color="danger">
                <p style={{ fontSize: 13, margin: '4px 0 8px' }}>{error}</p>
              </IonText>
            )}

            {resendMsg && (
              <IonText color="success">
                <p style={{ fontSize: 13, margin: '4px 0 8px' }}>{resendMsg}</p>
              </IonText>
            )}

            <IonButton
              expand="block"
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="btn-primary"
              style={{ marginTop: 16 }}
            >
              {loading ? <IonSpinner name="crescent" /> : t('otp_btn')}
            </IonButton>
          </div>

          {/* Reenviar código */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            {countdown > 0 ? (
              <p style={{ fontSize: 13, color: 'var(--pep-text-light)' }}>
                Reenviar código en <strong>{countdown}s</strong>
              </p>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--pep-text-light)' }}>
                ¿No recibiste el código?{' '}
                <span
                  style={{ color: 'var(--pep-purple)', fontWeight: 600, cursor: resending ? 'default' : 'pointer' }}
                  onClick={handleResend}
                >
                  {resending ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> : t('otp_resend')}
                </span>
              </p>
            )}
          </div>

          <p
            style={{ textAlign: 'center', marginTop: 12, color: 'var(--pep-purple)', cursor: 'pointer', fontSize: 14 }}
            onClick={() => history.replace('/login')}
          >
            ← Volver al inicio
          </p>
        </div>
      </IonContent>
    </IonPage>
  )
}
