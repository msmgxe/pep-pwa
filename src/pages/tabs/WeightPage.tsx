import { useEffect, useState } from 'react'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonSpinner, IonModal, IonInput, IonTextarea,
  IonAlert, IonFab, IonFabButton, IonRefresher, IonRefresherContent,
  IonList, IonDatetime, IonButtons
} from '@ionic/react'
import { addOutline, trashOutline, createOutline, cameraOutline, closeCircleOutline } from 'ionicons/icons'
import { useTranslation } from 'react-i18next'
import {
  getProfile, getMeasurements, addMeasurement, updateMeasurement,
  deleteMeasurement, uploadPhoto, type Measurement, type Profile
} from '../../services/supabase'

function bmiLabel(bmi: number) {
  if (bmi < 18.5) return { label: 'Bajo peso', color: '#2196F3' }
  if (bmi < 25)   return { label: 'Normal',     color: '#4CAF50' }
  if (bmi < 30)   return { label: 'Sobrepeso',  color: '#FF9800' }
  return           { label: 'Obesidad',          color: '#F44336' }
}

export default function WeightPage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Measurement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [form, setForm] = useState({ date: '', weight: '', notes: '', photoUrl: '' })
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    try {
      const p = await getProfile()
      if (!p) return
      const m = await getMeasurements(p.id)
      setProfile(p)
      setMeasurements(m)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ date: new Date().toISOString().split('T')[0], weight: '', notes: '', photoUrl: '' })
    setPhotoPreview(null)
    setShowModal(true)
  }

  const openEdit = (m: Measurement) => {
    setEditing(m)
    setForm({ date: m.measurement_date, weight: String(m.weight_kg ?? ''), notes: m.notes ?? '', photoUrl: m.photo_url ?? '' })
    setPhotoPreview(m.photo_url ?? null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!profile || !form.weight || isNaN(Number(form.weight))) return
    setSaving(true)
    try {
      const data = {
        patient_id: profile.id,
        measurement_date: form.date,
        weight_kg: Number(form.weight),
        notes: form.notes || undefined,
        photo_url: form.photoUrl || undefined,
      }
      if (editing) await updateMeasurement(editing.id, data)
      else await addMeasurement(data)
      await load()
      setShowModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    await deleteMeasurement(id)
    setMeasurements(prev => prev.filter(m => m.id !== id))
  }

  const handlePhoto = async () => {
    if (!profile) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const url = await uploadPhoto(file, profile.id)
      set('photoUrl', url)
      setPhotoPreview(url)
    }
    input.click()
  }

  const removePhoto = () => {
    set('photoUrl', '')
    setPhotoPreview(null)
  }

  const calcBmi = (weightKg: number) => {
    if (!profile?.height_cm) return null
    const h = profile.height_cm / 100
    return weightKg / (h * h)
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('weight_title')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async e => { await load(); e.detail.complete() }}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : measurements.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--pep-text-light)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
            <p style={{ fontWeight: 600 }}>{t('weight_empty')}</p>
            <p style={{ fontSize: 13 }}>{t('weight_empty_hint')}</p>
          </div>
        ) : (
          <IonList style={{ padding: '8px 12px' }}>
            {measurements.map(m => {
              const bmi = m.weight_kg ? calcBmi(m.weight_kg) : null
              const info = bmi ? bmiLabel(bmi) : null
              return (
                <div key={m.id} className="pep-card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--pep-purple)' }}>
                        {m.weight_kg?.toFixed(1)} <span style={{ fontSize: 14 }}>kg</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--pep-text-light)' }}>
                        {new Date(m.measurement_date).toLocaleDateString()}
                      </div>
                      {info && (
                        <span style={{
                          display: 'inline-block', marginTop: 4, padding: '2px 8px',
                          borderRadius: 10, background: info.color + '22',
                          color: info.color, fontSize: 11, fontWeight: 600
                        }}>
                          {info.label} · {bmi?.toFixed(1)}
                        </span>
                      )}
                      {m.notes && <div style={{ fontSize: 12, marginTop: 4, color: 'var(--pep-text-light)' }}>{m.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {m.photo_url && (
                        <img
                          src={m.photo_url}
                          alt="foto"
                          style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => window.open(m.photo_url, '_blank')}
                        />
                      )}
                      <div style={{ display: 'flex', gap: 4 }}>
                        <IonButton fill="clear" size="small" onClick={() => openEdit(m)}>
                          <IonIcon icon={createOutline} color="primary" />
                        </IonButton>
                        <IonButton fill="clear" size="small" onClick={() => setDeleteTarget(m.id)}>
                          <IonIcon icon={trashOutline} color="danger" />
                        </IonButton>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton color="primary" onClick={openAdd}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* Add/Edit Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editing ? t('weight_edit_dialog') : t('weight_add_dialog')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>{t('cancel')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonButton expand="block" fill="outline" color="primary" onClick={() => setShowDatePicker(true)} style={{ marginBottom: 12 }}>
              {form.date ? new Date(form.date).toLocaleDateString() : t('weight_date')}
            </IonButton>
            <IonModal isOpen={showDatePicker} onDidDismiss={() => setShowDatePicker(false)}>
              <IonContent>
                <IonDatetime
                  presentation="date"
                  showDefaultButtons
                  doneText="Confirmar"
                  cancelText="Cancelar"
                  max={new Date().toISOString()}
                  value={form.date || undefined}
                  onIonChange={e => {
                    const v = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value
                    set('date', (v ?? '').split('T')[0])
                    setShowDatePicker(false)
                  }}
                  onIonCancel={() => setShowDatePicker(false)}
                />
              </IonContent>
            </IonModal>
            <IonInput
              label={t('weight_field', { unit: 'kg' })}
              labelPlacement="floating"
              type="number"
              inputmode="decimal"
              value={form.weight}
              onIonInput={e => set('weight', e.detail.value ?? '')}
              style={{ marginBottom: 12 }}
            />
            <IonTextarea
              label={t('weight_notes')}
              labelPlacement="floating"
              value={form.notes}
              onIonInput={e => set('notes', e.detail.value ?? '')}
              rows={2}
              style={{ marginBottom: 16 }}
            />

            {/* Photo section */}
            {photoPreview ? (
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <img
                  src={photoPreview}
                  alt="foto"
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }}
                />
                <IonButton
                  fill="clear" size="small" color="danger"
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.9)', borderRadius: '50%' }}
                  onClick={removePhoto}
                >
                  <IonIcon icon={closeCircleOutline} />
                </IonButton>
              </div>
            ) : (
              <IonButton expand="block" fill="outline" color="primary" onClick={handlePhoto} style={{ marginBottom: 12 }}>
                <IonIcon icon={cameraOutline} slot="start" /> {t('weight_camera')}
              </IonButton>
            )}

            <IonButton expand="block" onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <IonSpinner name="crescent" /> : t('save')}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={!!deleteTarget}
          header={t('weight_delete_title')}
          message={t('weight_delete_confirm')}
          buttons={[
            { text: t('cancel'), role: 'cancel', handler: () => setDeleteTarget(null) },
            { text: t('delete'), role: 'destructive', handler: () => { handleDelete(deleteTarget!); setDeleteTarget(null) } }
          ]}
          onDidDismiss={() => setDeleteTarget(null)}
        />
      </IonContent>
    </IonPage>
  )
}
