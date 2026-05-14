import { useEffect, useState } from 'react'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonInput, IonSelect, IonSelectOption, IonSpinner,
  IonModal, IonDatetime, IonIcon
} from '@ionic/react'
import { cameraOutline, arrowBackOutline } from 'ionicons/icons'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { getProfile, upsertProfile, uploadPhoto, type Profile } from '../../services/supabase'
import { setLanguage } from '../../i18n'

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const history = useHistory()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', birth_date: '', sex: '',
    height_cm: '', weight_kg: '', goal_weight: '',
    weight_unit: 'kg', height_unit: 'cm',
    medications: '',
  })
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    getProfile().then(p => {
      if (p) {
        setProfileId(p.id)
        setPhotoUrl(p.photo_url ?? null)
        setForm({
          full_name:   p.full_name ?? '',
          phone:       p.phone ?? '',
          birth_date:  p.birth_date ?? '',
          sex:         p.sex ?? '',
          height_cm:   String(p.height_cm ?? ''),
          weight_kg:   String(p.weight_kg ?? ''),
          goal_weight: '',
          weight_unit: p.weight_unit ?? 'kg',
          height_unit: p.height_unit ?? 'cm',
          medications: p.medications ?? '',
        })
      }
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem('pep_weight_unit', form.weight_unit)
      localStorage.setItem('pep_height_unit', form.height_unit)
      await upsertProfile({
        full_name:   form.full_name || undefined,
        phone:       form.phone || undefined,
        birth_date:  form.birth_date || undefined,
        sex:         (form.sex as Profile['sex']) || undefined,
        height_cm:   form.height_cm ? Number(form.height_cm) : undefined,
        weight_kg:   form.weight_kg ? Number(form.weight_kg) : undefined,
        medications: form.medications || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  const handlePhoto = async () => {
    if (!profileId) return
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'user'
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return
      const url = await uploadPhoto(file, profileId)
      await upsertProfile({ photo_url: url })
      setPhotoUrl(url)
    }
    input.click()
  }

  const changeLanguage = (lang: string) => {
    setLanguage(lang as 'es' | 'en' | 'pt')
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{t('profile_title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={saving} strong>
              {saving ? <IonSpinner name="crescent" style={{ width: 18, height: 18 }} /> : t('save')}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            {saved && (
              <div style={{ background: '#e8f5e9', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#388e3c', fontWeight: 600, fontSize: 14 }}>
                ✓ {t('profile_saved')}
              </div>
            )}

            {/* Avatar */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{
                  width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                  background: 'var(--pep-purple-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {photoUrl
                    ? <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#fff', fontSize: 36 }}>👤</span>
                  }
                </div>
                <IonButton
                  fill="solid" size="small" color="primary"
                  style={{ position: 'absolute', bottom: -4, right: -4, '--border-radius': '50%', width: 32, height: 32 }}
                  onClick={handlePhoto}
                >
                  <IonIcon icon={cameraOutline} style={{ fontSize: 14 }} />
                </IonButton>
              </div>
            </div>

            {/* Personal info */}
            <div className="pep-card" style={{ marginBottom: 12 }}>
              <IonInput label={t('profile_name')} labelPlacement="floating" value={form.full_name}
                onIonInput={e => set('full_name', e.detail.value ?? '')} style={{ marginBottom: 12 }} />
              <IonInput label="WhatsApp" labelPlacement="floating" type="tel" value={form.phone}
                onIonInput={e => set('phone', e.detail.value ?? '')} style={{ marginBottom: 12 }} />
              <IonButton expand="block" fill="outline" color="primary" onClick={() => setShowDatePicker(true)}>
                {form.birth_date
                  ? `${t('profile_birth_date')}: ${new Date(form.birth_date).toLocaleDateString()}`
                  : t('profile_birth_date_select')}
              </IonButton>
              <IonModal isOpen={showDatePicker} onDidDismiss={() => setShowDatePicker(false)}>
                <IonContent>
                  <IonDatetime presentation="date" max={new Date().toISOString()}
                    value={form.birth_date || undefined}
                    onIonChange={e => {
                      const v = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value
                      set('birth_date', (v ?? '').split('T')[0])
                      setShowDatePicker(false)
                    }} />
                </IonContent>
              </IonModal>
              <IonSelect label={t('profile_sex')} labelPlacement="floating" value={form.sex}
                onIonChange={e => set('sex', e.detail.value)} style={{ marginTop: 12 }}>
                <IonSelectOption value="male">{t('sex_male')}</IonSelectOption>
                <IonSelectOption value="female">{t('sex_female')}</IonSelectOption>
              </IonSelect>
            </div>

            {/* Units + measurements */}
            <div className="pep-card" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pep-text-light)', marginBottom: 10 }}>{t('profile_units_title')}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {(['kg','lbs'] as const).map(u => (
                  <IonButton key={u} size="small" fill={form.weight_unit === u ? 'solid' : 'outline'} color="primary" onClick={() => set('weight_unit', u)}>{u}</IonButton>
                ))}
                {(['cm','ft'] as const).map(u => (
                  <IonButton key={u} size="small" fill={form.height_unit === u ? 'solid' : 'outline'} color="primary" onClick={() => set('height_unit', u)}>{u}</IonButton>
                ))}
              </div>
              <IonInput label={form.height_unit === 'cm' ? t('profile_height_cm') : t('profile_height_ft')}
                labelPlacement="floating" type="number" inputmode="decimal"
                value={form.height_cm} onIonInput={e => set('height_cm', e.detail.value ?? '')} style={{ marginBottom: 12 }} />
              <IonInput label={t('profile_weight', { unit: form.weight_unit })}
                labelPlacement="floating" type="number" inputmode="decimal"
                value={form.weight_kg} onIonInput={e => set('weight_kg', e.detail.value ?? '')} />
            </div>

            {/* Medications */}
            <div className="pep-card" style={{ marginBottom: 12 }}>
              <IonInput label={t('onboarding_medications_label')} labelPlacement="floating"
                value={form.medications} onIonInput={e => set('medications', e.detail.value ?? '')} />
            </div>

            {/* Language */}
            <div className="pep-card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pep-text-light)', marginBottom: 10 }}>{t('profile_language')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['es','en','pt'] as const).map(lang => (
                  <IonButton key={lang} size="small"
                    fill={i18n.language === lang ? 'solid' : 'outline'} color="primary"
                    onClick={() => changeLanguage(lang)}>
                    {t(`lang_${lang}`)}
                  </IonButton>
                ))}
              </div>
            </div>

            <IonButton expand="block" onClick={handleSave} disabled={saving} className="btn-primary" style={{ marginBottom: 32 }}>
              {saving ? <IonSpinner name="crescent" /> : t('save_changes')}
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}
