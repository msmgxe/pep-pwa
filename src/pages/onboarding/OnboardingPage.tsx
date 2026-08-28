import { useState } from 'react'
import {
  IonPage, IonContent, IonButton, IonInput, IonText, IonSpinner,
  IonSelect, IonSelectOption, IonDatetime, IonModal
} from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { upsertProfile, normalizeSex } from '../../services/supabase'

const TOTAL_STEPS = 6

export default function OnboardingPage() {
  const { t } = useTranslation()
  const history = useHistory()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [form, setForm] = useState({
    phone: '',
    weight_kg: '',
    height_cm: '',
    birth_date: '',
    sex: '',
    medications: '',
    weight_unit: 'kg' as 'kg' | 'lbs',
    height_unit: 'cm' as 'cm' | 'ft',
  })

  const set = (key: keyof typeof form, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  const steps = [
    { title: t('onboarding_step_phone'), icon: '📱' },
    { title: t('onboarding_step_weight'), icon: '⚖️' },
    { title: t('onboarding_step_height'), icon: '📏' },
    { title: t('onboarding_step_age'), icon: '🎂' },
    { title: t('onboarding_step_sex'), icon: '👤' },
    { title: t('onboarding_step_medications'), icon: '💊' },
  ]

  const validate = (): string => {
    if (step === 1 && (!form.weight_kg || isNaN(Number(form.weight_kg)))) return t('invalid_number')
    if (step === 2 && (!form.height_cm || isNaN(Number(form.height_cm)))) return t('invalid_number')
    return ''
  }

  const next = () => {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1)
    else handleFinish()
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      // weight_unit / height_unit no existen en Supabase — se guardan local
      localStorage.setItem('pep_weight_unit', form.weight_unit)
      localStorage.setItem('pep_height_unit', form.height_unit)
      await upsertProfile({
        phone: form.phone || undefined,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        height_cm: form.height_cm ? Number(form.height_cm) : undefined,
        birth_date: form.birth_date || undefined,
        sex: normalizeSex(form.sex),
        medications: form.medications || undefined,
        role: 'usuario',
      })
      history.replace('/tabs/home')
    } catch (e: any) {
      console.error('[onboarding] no se pudo guardar el perfil', e)
      const detail = e?.message ? ` (${e.message})` : ''
      setError(`${t('onboarding_save_error')}${detail}`)
    } finally {
      setSaving(false)
    }
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--pep-purple-pale)' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', padding: '48px 20px 32px' }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>{steps[step].icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--pep-text-light)' }}>
                  Paso {step + 1} de {TOTAL_STEPS}
                </p>
                <h2 style={{ margin: 0, color: 'var(--pep-purple)', fontWeight: 700, fontSize: 20 }}>
                  {steps[step].title}
                </h2>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, background: 'var(--pep-purple-mid)', borderRadius: 3 }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'var(--pep-purple)', borderRadius: 3,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div className="pep-card" style={{ marginBottom: 24 }}>
            {/* Step 0: Phone */}
            {step === 0 && (
              <IonInput
                label={t('onboarding_phone_label')}
                labelPlacement="floating"
                type="tel"
                placeholder={t('onboarding_phone_placeholder')}
                value={form.phone}
                onIonInput={e => set('phone', e.detail.value ?? '')}
              />
            )}

            {/* Step 1: Weight */}
            {step === 1 && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <IonButton
                    fill={form.weight_unit === 'kg' ? 'solid' : 'outline'}
                    size="small"
                    color="primary"
                    onClick={() => set('weight_unit', 'kg')}
                  >kg</IonButton>
                  <IonButton
                    fill={form.weight_unit === 'lbs' ? 'solid' : 'outline'}
                    size="small"
                    color="primary"
                    onClick={() => set('weight_unit', 'lbs')}
                  >lbs</IonButton>
                </div>
                <IonInput
                  label={t('weight_field', { unit: form.weight_unit })}
                  labelPlacement="floating"
                  type="number"
                  inputmode="decimal"
                  value={form.weight_kg}
                  onIonInput={e => set('weight_kg', e.detail.value ?? '')}
                />
              </>
            )}

            {/* Step 2: Height */}
            {step === 2 && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <IonButton
                    fill={form.height_unit === 'cm' ? 'solid' : 'outline'}
                    size="small"
                    color="primary"
                    onClick={() => set('height_unit', 'cm')}
                  >cm</IonButton>
                  <IonButton
                    fill={form.height_unit === 'ft' ? 'solid' : 'outline'}
                    size="small"
                    color="primary"
                    onClick={() => set('height_unit', 'ft')}
                  >ft</IonButton>
                </div>
                <IonInput
                  label={form.height_unit === 'cm' ? t('profile_height_cm') : t('profile_height_ft')}
                  labelPlacement="floating"
                  type="number"
                  inputmode="decimal"
                  value={form.height_cm}
                  onIonInput={e => set('height_cm', e.detail.value ?? '')}
                />
              </>
            )}

            {/* Step 3: Birth date */}
            {step === 3 && (
              <>
                <IonButton
                  expand="block"
                  fill="outline"
                  color="primary"
                  onClick={() => setShowDatePicker(true)}
                >
                  {form.birth_date
                    ? new Date(form.birth_date).toLocaleDateString()
                    : t('profile_birth_date_select')}
                </IonButton>
                <IonModal isOpen={showDatePicker} onDidDismiss={() => setShowDatePicker(false)}>
                  <IonContent>
                    <IonDatetime
                      presentation="date"
                      showDefaultButtons
                      doneText="Confirmar"
                      cancelText="Cancelar"
                      max={new Date().toISOString()}
                      value={form.birth_date || undefined}
                      onIonChange={e => {
                        const v = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value
                        set('birth_date', (v ?? '').split('T')[0])
                        setShowDatePicker(false)
                      }}
                      onIonCancel={() => setShowDatePicker(false)}
                    />
                  </IonContent>
                </IonModal>
              </>
            )}

            {/* Step 4: Sex */}
            {step === 4 && (
              <IonSelect
                label={t('profile_sex')}
                labelPlacement="floating"
                value={form.sex}
                onIonChange={e => set('sex', e.detail.value)}
              >
                <IonSelectOption value="masculino">{t('sex_male')}</IonSelectOption>
                <IonSelectOption value="femenino">{t('sex_female')}</IonSelectOption>
              </IonSelect>
            )}

            {/* Step 5: Medications */}
            {step === 5 && (
              <IonInput
                label={t('onboarding_medications_label')}
                labelPlacement="floating"
                placeholder={t('onboarding_medications_placeholder')}
                value={form.medications}
                onIonInput={e => set('medications', e.detail.value ?? '')}
              />
            )}

            {error && (
              <IonText color="danger">
                <p style={{ fontSize: 13, margin: '8px 0 0' }}>{error}</p>
              </IonText>
            )}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 12 }}>
            {step > 0 && (
              <IonButton
                expand="block"
                fill="outline"
                color="primary"
                onClick={() => { setStep(s => s - 1); setError('') }}
                style={{ flex: 1 }}
              >
                {t('onboarding_back')}
              </IonButton>
            )}
            <IonButton
              expand="block"
              onClick={next}
              disabled={saving}
              className="btn-primary"
              style={{ flex: 2 }}
            >
              {saving
                ? <IonSpinner name="crescent" />
                : step === TOTAL_STEPS - 1 ? t('onboarding_finish') : t('onboarding_next')
              }
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
