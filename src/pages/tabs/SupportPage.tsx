import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/react'
import { logoWhatsapp } from 'ionicons/icons'
import { useTranslation } from 'react-i18next'

const WHATSAPP_NUMBER = '525512345678'

export default function SupportPage() {
  const { t } = useTranslation()

  const openWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('support_title')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: 40, textAlign: 'center' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'var(--pep-purple-pale)', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48
          }}>
            🩺
          </div>

          <h2 style={{ color: 'var(--pep-purple)', marginBottom: 8 }}>{t('support_question')}</h2>

          <p style={{ color: 'var(--pep-text-light)', lineHeight: 1.6, marginBottom: 32 }}>
            {t('support_description')}
          </p>

          <IonButton
            expand="block"
            onClick={openWhatsApp}
            style={{ '--background': '#25D366', '--color': '#fff', '--border-radius': '12px', height: 52, fontWeight: 700, marginBottom: 24 }}
          >
            <IonIcon icon={logoWhatsapp} slot="start" />
            {t('support_whatsapp_btn')}
          </IonButton>

          <div className="pep-card" style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--pep-text-light)', whiteSpace: 'pre-line' }}>
              🕐 {t('support_hours')}
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
