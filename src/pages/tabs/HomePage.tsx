import { useEffect, useState } from 'react'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
  IonModal, IonInput
} from '@ionic/react'
import { personOutline, logOutOutline, createOutline, cameraOutline } from 'ionicons/icons'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import {
  getProfile, getMeasurements, getCalendarEvents, signOut, upsertProfile, uploadPhoto,
  type Profile, type Measurement, type CalendarEvent
} from '../../services/supabase'

function calcBmi(weightKg: number, heightCm: number) {
  if (!heightCm) return null
  const h = heightCm / 100
  return weightKg / (h * h)
}

function bmiCategory(bmi: number, t: (k: string) => string) {
  if (bmi < 18.5) return { label: t('bmi_underweight'), color: '#2196F3' }
  if (bmi < 25)   return { label: t('bmi_normal'),      color: '#4CAF50' }
  if (bmi < 30)   return { label: t('bmi_overweight'),  color: '#FF9800' }
  return           { label: t('bmi_obesity'),            color: '#F44336' }
}

function greeting(t: (k: string) => string) {
  const h = new Date().getHours()
  if (h < 12) return t('home_greeting_morning')
  if (h < 19) return t('home_greeting_afternoon')
  return t('home_greeting_evening')
}

function calcAge(birthDate?: string) {
  if (!birthDate) return null
  const birth = new Date(birthDate.substring(0, 10))
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
  return age
}


export default function HomePage() {
  const { t } = useTranslation()
  const history = useHistory()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [latest, setLatest] = useState<Measurement | null>(null)
  const [recentMeasurements, setRecentMeasurements] = useState<Measurement[]>([])
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTargetEdit, setShowTargetEdit] = useState(false)
  const [targetInput, setTargetInput] = useState('')
  const [savingTarget, setSavingTarget] = useState(false)

  const load = async () => {
    try {
      const p = await getProfile()
      if (!p) return
      const [measurements, events] = await Promise.all([
        getMeasurements(p.id),
        getCalendarEvents(p.id),
      ])
      const today = new Date(); today.setHours(0,0,0,0)
      const next = events.find(e => new Date(e.event_date) >= today) ?? null
      setProfile(p)
      setLatest(measurements[0] ?? null)
      setRecentMeasurements(measurements.slice(0, 4))
      setNextEvent(next)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleLogout = async () => { await signOut(); history.replace('/login') }

  const handleAvatarPhoto = () => {
    if (!profile?.id) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const url = await uploadPhoto(file, profile.id)
      await upsertProfile({ photo_url: url })
      setProfile(p => p ? { ...p, photo_url: url } : p)
    }
    input.click()
  }

  const openTargetEdit = () => {
    setTargetInput(String(profile?.target_weight_kg ?? ''))
    setShowTargetEdit(true)
  }

  const saveTarget = async () => {
    if (!targetInput || isNaN(Number(targetInput))) return
    setSavingTarget(true)
    try {
      await upsertProfile({ target_weight_kg: Number(targetInput) })
      setProfile(p => p ? { ...p, target_weight_kg: Number(targetInput) } : p)
      setShowTargetEdit(false)
    } finally { setSavingTarget(false) }
  }

  const currentWeight = latest?.weight_kg ?? (profile?.weight_kg ?? null)
  const targetWeight = profile?.target_weight_kg ?? null
  const bmi = currentWeight && profile?.height_cm ? calcBmi(currentWeight, profile.height_cm) : null
  const bmiInfo = bmi ? bmiCategory(bmi, t) : null
  const age = calcAge(profile?.birth_date)
  const name = profile?.full_name ?? t('patient_default')

  const InfoChip = ({ label, value }: { label: string; value: string }) => (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--pep-text-light)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--pep-purple)' }}>{value}</div>
    </div>
  )

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t('app_name')}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{t('app_subtitle')}</div>
            </div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/profile')}>
              <IonIcon icon={personOutline} />
            </IonButton>
            <IonButton onClick={handleLogout}>
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async e => { await load(); e.detail.complete() }}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : (
            <>
              {/* Greeting with avatar */}
              <div className="pep-card" style={{ marginBottom: 12, background: 'var(--pep-purple)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid rgba(255,255,255,0.4)'
                    }}>
                      {profile?.photo_url
                        ? <img src={profile.photo_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 30 }}>{profile?.sex === 'male' ? '👨' : profile?.sex === 'female' ? '👩' : '👤'}</span>
                      }
                    </div>
                    <div
                      onClick={handleAvatarPhoto}
                      style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
                      }}
                    >
                      <IonIcon icon={cameraOutline} style={{ fontSize: 13, color: 'var(--pep-purple)' }} />
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{greeting(t)}</p>
                    <h2 style={{ margin: '2px 0 0', color: '#fff', fontSize: 22, fontWeight: 700 }}>{name}</h2>
                  </div>
                </div>
              </div>

              {/* Next appointment */}
              <div className="pep-card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>📅</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--pep-text-light)' }}>{t('home_next_appointment')}</div>
                  <div style={{ fontWeight: 600, color: 'var(--pep-purple)' }}>
                    {nextEvent
                      ? `${nextEvent.title} · ${new Date(nextEvent.event_date).toLocaleDateString()}`
                      : t('home_no_appointments')}
                  </div>
                </div>
              </div>

              {/* Weight cards */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div className="pep-card" style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--pep-text-light)', marginBottom: 4 }}>{t('home_current_weight')}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--pep-purple)' }}>
                    {currentWeight ? `${currentWeight.toFixed(1)}` : '--'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--pep-text-light)' }}>kg</div>
                </div>
                <div className="pep-card" style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  <div style={{ fontSize: 11, color: 'var(--pep-text-light)', marginBottom: 4 }}>{t('home_target_weight')}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--pep-purple-dark)' }}>
                    {targetWeight ? `${targetWeight.toFixed(1)}` : '--'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--pep-text-light)' }}>kg</div>
                  <IonButton
                    fill="clear" size="small"
                    style={{ position: 'absolute', top: 4, right: 4, '--padding-start': '4px', '--padding-end': '4px' }}
                    onClick={openTargetEdit}
                  >
                    <IonIcon icon={createOutline} color="primary" style={{ fontSize: 16 }} />
                  </IonButton>
                </div>
              </div>

              {/* BMI */}
              {bmi && bmiInfo && (
                <div className="pep-card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--pep-text-light)', marginBottom: 8 }}>{t('home_bmi')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: bmiInfo.color, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{bmi.toFixed(1)}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: bmiInfo.color, fontSize: 16 }}>{bmiInfo.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--pep-text-light)' }}>{t('bmi_formula')}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: 'linear-gradient(to right, #2196F3 0%, #4CAF50 30%, #FF9800 60%, #F44336 100%)', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', top: -4, width: 16, height: 16,
                      borderRadius: '50%', background: '#fff',
                      border: `3px solid ${bmiInfo.color}`,
                      left: `${Math.min(Math.max(((bmi - 15) / 25) * 100, 2), 98)}%`,
                      transform: 'translateX(-50%)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--pep-text-light)' }}>
                    <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                  </div>
                </div>
              )}

              {/* Recent weight history */}
              {recentMeasurements.length > 0 && (
                <div className="pep-card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pep-text-light)', marginBottom: 10 }}>
                    {t('home_recent_weights')}
                  </div>
                  {recentMeasurements.map((m, i) => (
                    <div key={m.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0',
                      borderTop: i > 0 ? '1px solid var(--pep-purple-mid)' : 'none'
                    }}>
                      <div style={{ fontSize: 13, color: 'var(--pep-text-light)' }}>
                        {new Date(m.measurement_date).toLocaleDateString()}
                      </div>
                      <div style={{ fontWeight: 700, color: i === 0 ? 'var(--pep-purple)' : 'var(--pep-text)', fontSize: 15 }}>
                        {m.weight_kg?.toFixed(1)} <span style={{ fontSize: 11, fontWeight: 400 }}>kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Info chips */}
              {profile && (
                <div className="pep-card" style={{ display: 'flex', gap: 8 }}>
                  {profile.height_cm && <InfoChip label={t('info_height')} value={`${profile.height_cm} cm`} />}
                  {profile.sex && <InfoChip label={t('info_sex')} value={profile.sex === 'male' ? t('sex_male') : t('sex_female')} />}
                  {age !== null && <InfoChip label={t('info_age')} value={t('years_suffix', { n: age })} />}
                </div>
              )}
            </>
          )}
        </div>

        {/* Target weight edit modal */}
        <IonModal isOpen={showTargetEdit} onDidDismiss={() => setShowTargetEdit(false)} style={{ '--height': 'auto' }}>
          <div style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--pep-purple)', fontWeight: 700 }}>
              {t('home_target_weight')}
            </h3>
            <IonInput
              label="kg"
              labelPlacement="stacked"
              type="number"
              inputmode="decimal"
              value={targetInput}
              onIonInput={e => setTargetInput(e.detail.value ?? '')}
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <IonButton expand="block" fill="outline" color="primary" onClick={() => setShowTargetEdit(false)} style={{ flex: 1 }}>
                {t('cancel')}
              </IonButton>
              <IonButton expand="block" className="btn-primary" onClick={saveTarget} disabled={savingTarget} style={{ flex: 2 }}>
                {savingTarget ? <IonSpinner name="crescent" /> : t('save')}
              </IonButton>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  )
}
