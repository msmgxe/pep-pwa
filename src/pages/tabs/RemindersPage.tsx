import { useEffect, useState } from 'react'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonSpinner, IonModal,
  IonAlert, IonFab, IonFabButton, IonRefresher, IonRefresherContent,
  IonButtons
} from '@ionic/react'
import { addOutline, trashOutline, createOutline, calendarOutline } from 'ionicons/icons'
import { useTranslation } from 'react-i18next'
import {
  getProfile, getCalendarEvents, addCalendarEvent, updateCalendarEvent,
  deleteCalendarEvent, type CalendarEvent, type Profile
} from '../../services/supabase'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(first).fill(null)
  for (let i = 1; i <= days; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function RemindersPage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(() => {
    const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  })
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const load = async () => {
    try {
      const p = await getProfile()
      if (!p) return
      const ev = await getCalendarEvents(p.id)
      setProfile(p); setEvents(ev)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Reset form fields whenever the modal opens (add or edit)
  useEffect(() => {
    if (showModal) {
      setFormTitle(editing?.title ?? '')
      setFormNotes(editing?.notes ?? '')
    }
  }, [showModal, editing?.id])

  const eventDates = new Set(events.map(e => e.event_date.substring(0, 10)))
  const selectedEvents = events.filter(e => e.event_date.substring(0, 10) === selected)
  const cells = buildCalendar(viewYear, viewMonth)

  const openAdd = () => { setEditing(null); setShowModal(true) }
  const openEdit = (ev: CalendarEvent) => { setEditing(ev); setShowModal(true) }

  const handleSave = async () => {
    if (!profile || !formTitle.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateCalendarEvent(editing.id, {
          event_date: selected,
          title: formTitle.trim(),
          notes: formNotes.trim() || undefined,
        })
      } else {
        await addCalendarEvent({
          patient_id: profile.id,
          event_date: selected,
          title: formTitle.trim(),
          notes: formNotes.trim() || undefined,
        })
      }
      setShowModal(false)
      load()
    } catch (e) {
      console.error('Error saving reminder:', e)
      setSaveError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <div style={{ lineHeight: 1.2, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t('app_name')}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{t('reminders_title')}</div>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async e => { await load(); e.detail.complete() }}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : (
            <>
              {/* Calendar */}
              <div className="pep-card" style={{ marginBottom: 12 }}>
                {/* Month nav */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <IonButton fill="clear" size="small" onClick={prevMonth}>‹</IonButton>
                  <span style={{ fontWeight: 700, color: 'var(--pep-purple)' }}>{MONTHS[viewMonth]} {viewYear}</span>
                  <IonButton fill="clear" size="small" onClick={nextMonth}>›</IonButton>
                </div>
                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
                  {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--pep-text-light)', fontWeight: 600 }}>{d}</div>)}
                </div>
                {/* Cells */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                  {cells.map((day, i) => {
                    if (!day) return <div key={i} />
                    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                    const isSelected = dateStr === selected
                    const isToday = dateStr === todayStr
                    const hasEvent = eventDates.has(dateStr)
                    return (
                      <div
                        key={i}
                        onClick={() => setSelected(dateStr)}
                        style={{
                          textAlign: 'center', padding: '6px 2px', borderRadius: 8, cursor: 'pointer', position: 'relative',
                          background: isSelected ? 'var(--pep-purple)' : isToday ? 'var(--pep-purple-pale)' : 'transparent',
                          color: isSelected ? '#fff' : isToday ? 'var(--pep-purple)' : 'var(--pep-text)',
                          fontWeight: isSelected || isToday ? 700 : 400, fontSize: 13,
                          border: isToday && !isSelected ? '1px solid var(--pep-purple-mid)' : 'none',
                        }}
                      >
                        {day}
                        {hasEvent && !isSelected && (
                          <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--pep-yellow)', display: 'block' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Events for selected day */}
              <div style={{ marginBottom: 60 }}>
                <div style={{ fontWeight: 700, color: 'var(--pep-purple)', marginBottom: 8, fontSize: 14 }}>
                  {new Date(selected + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                {selectedEvents.length === 0 ? (
                  <div className="pep-card" style={{ textAlign: 'center', color: 'var(--pep-text-light)', fontSize: 13 }}>
                    <IonIcon icon={calendarOutline} style={{ fontSize: 32, display: 'block', margin: '0 auto 8px' }} />
                    {t('reminder_none_today')}
                  </div>
                ) : selectedEvents.map(ev => (
                  <div key={ev.id} className="pep-card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--pep-purple)' }}>{ev.title}</div>
                      {ev.notes && <div style={{ fontSize: 12, color: 'var(--pep-text-light)' }}>{ev.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <IonButton fill="clear" size="small" onClick={() => openEdit(ev)}>
                        <IonIcon icon={createOutline} color="primary" />
                      </IonButton>
                      <IonButton fill="clear" size="small" onClick={() => setDeleteTarget(ev.id)}>
                        <IonIcon icon={trashOutline} color="danger" />
                      </IonButton>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton color="primary" onClick={openAdd}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                <div style={{ lineHeight: 1.2, textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{t('app_name')}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{editing ? t('reminder_edit') : t('reminder_add')}</div>
                </div>
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>{t('cancel')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <p style={{ fontSize: 13, color: 'var(--pep-text-light)', marginBottom: 16 }}>
              {new Date(selected + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--pep-text-light)', marginBottom: 6 }}>
                {t('reminder_title_field')}
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 16, borderRadius: 10,
                  border: '1.5px solid var(--ion-border-color, #ddd)',
                  background: 'var(--ion-background-color, #fff)',
                  color: 'var(--ion-text-color, #000)', boxSizing: 'border-box', outline: 'none'
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--pep-text-light)', marginBottom: 6 }}>
                {t('reminder_notes')}
              </label>
              <textarea
                rows={4}
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 16, borderRadius: 10,
                  border: '1.5px solid var(--ion-border-color, #ddd)',
                  background: 'var(--ion-background-color, #fff)',
                  color: 'var(--ion-text-color, #000)', boxSizing: 'border-box',
                  resize: 'none', outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
            <IonButton expand="block" onClick={handleSave} disabled={saving || !formTitle.trim()} className="btn-primary">
              {saving ? <IonSpinner name="crescent" /> : t('save')}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={!!saveError}
          header="Error"
          message={saveError ?? ''}
          buttons={[{ text: t('cancel'), handler: () => setSaveError(null) }]}
          onDidDismiss={() => setSaveError(null)}
        />

        <IonAlert
          isOpen={!!deleteTarget}
          header={t('reminder_delete_title')}
          message={t('reminder_delete_confirm')}
          buttons={[
            { text: t('cancel'), role: 'cancel', handler: () => setDeleteTarget(null) },
            { text: t('delete'), role: 'destructive', handler: () => { deleteCalendarEvent(deleteTarget!).then(load); setDeleteTarget(null) } }
          ]}
          onDidDismiss={() => setDeleteTarget(null)}
        />
      </IonContent>
    </IonPage>
  )
}
