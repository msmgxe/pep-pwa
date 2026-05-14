import { useEffect, useState } from 'react'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSpinner, IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton, IonLabel
} from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { getProfile, getMeasurements, type Profile, type Measurement } from '../../services/supabase'

function calcBmi(w: number, h: number) { const hm = h / 100; return w / (hm * hm) }

type Period = '1m' | '3m' | '6m' | 'all'

export default function ProgressPage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('3m')

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

  const filterByPeriod = (ms: Measurement[]) => {
    if (period === 'all') return [...ms].reverse()
    const days = period === '1m' ? 30 : period === '3m' ? 90 : 180
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days)
    return [...ms].reverse().filter(m => new Date(m.measurement_date) >= cutoff)
  }

  const filtered = filterByPeriod(measurements)
  const chartData = filtered.map(m => ({
    date: new Date(m.measurement_date).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
    weight: m.weight_kg,
  }))

  const first = measurements[measurements.length - 1]
  const latest = measurements[0]
  const goal = profile?.weight_kg
  const diff = first && latest ? (latest.weight_kg ?? 0) - (first.weight_kg ?? 0) : null
  const bmi = latest?.weight_kg && profile?.height_cm ? calcBmi(latest.weight_kg, profile.height_cm) : null

  const achievements = [
    { id: 1, name: t('ach_1_name'), desc: t('ach_1_desc'), icon: '🏁', earned: measurements.length >= 1 },
    { id: 2, name: t('ach_2_name'), desc: t('ach_2_desc'), icon: '📅', earned: measurements.length >= 7 },
    { id: 3, name: t('ach_3_name'), desc: t('ach_3_desc'), icon: '📉', earned: first && latest ? ((first.weight_kg ?? 0) - (latest.weight_kg ?? 0)) / (first.weight_kg ?? 1) >= 0.05 : false },
    { id: 4, name: t('ach_4_name'), desc: t('ach_4_desc'), icon: '🎯', earned: goal && latest?.weight_kg ? Math.abs(latest.weight_kg - goal) <= 2 : false },
    { id: 5, name: t('ach_5_name'), desc: t('ach_5_desc'), icon: '🏆', earned: goal && latest?.weight_kg ? latest.weight_kg <= goal : false },
    { id: 6, name: t('ach_6_name'), desc: t('ach_6_desc'), icon: '💚', earned: bmi ? bmi >= 18.5 && bmi < 25 : false },
  ]

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('progress_title')}</IonTitle>
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
          ) : measurements.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--pep-text-light)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
              <p style={{ fontWeight: 600 }}>{t('progress_no_records')}</p>
              <p style={{ fontSize: 13 }}>{t('progress_hint')}</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[
                  { label: t('progress_initial_weight'), value: first?.weight_kg ? `${first.weight_kg.toFixed(1)} kg` : '--' },
                  { label: t('progress_today'), value: latest?.weight_kg ? `${latest.weight_kg.toFixed(1)} kg` : '--' },
                  { label: t('progress_goal'), value: goal ? `${goal.toFixed(1)} kg` : '--' },
                ].map(({ label, value }) => (
                  <div key={label} className="pep-card" style={{ flex: 1, textAlign: 'center', padding: 10 }}>
                    <div style={{ fontSize: 10, color: 'var(--pep-text-light)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pep-purple)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Diff banner */}
              {diff !== null && (
                <div className="pep-card" style={{ marginBottom: 12, background: diff < 0 ? '#e8f5e9' : '#fff3e0', textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, color: diff < 0 ? '#388e3c' : '#e65100', fontSize: 18 }}>
                    {diff < 0 ? '▼' : '▲'} {Math.abs(diff).toFixed(1)} kg
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--pep-text-light)' }}>
                    {diff < 0 ? t('progress_decreased') : t('progress_increased')}
                  </p>
                </div>
              )}

              {/* Period selector */}
              <IonSegment value={period} onIonChange={e => setPeriod(e.detail.value as Period)} style={{ marginBottom: 12 }}>
                {(['1m', '3m', '6m', 'all'] as Period[]).map(p => (
                  <IonSegmentButton key={p} value={p}>
                    <IonLabel style={{ fontSize: 12 }}>{p === 'all' ? 'Todo' : p}</IonLabel>
                  </IonSegmentButton>
                ))}
              </IonSegment>

              {/* Chart */}
              <div className="pep-card" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--pep-text-light)', marginBottom: 8 }}>{t('progress_chart_title')}</div>
                {chartData.length < 2 ? (
                  <p style={{ color: 'var(--pep-text-light)', fontSize: 13, textAlign: 'center' }}>{t('progress_no_records_period')}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e6f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                      <Tooltip />
                      {goal && <ReferenceLine y={goal} stroke="#FFD700" strokeDasharray="4 4" label={{ value: 'Meta', fontSize: 10, fill: '#888' }} />}
                      <Line type="monotone" dataKey="weight" stroke="#7B2D8B" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* BMI */}
              {bmi && (
                <div className="pep-card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--pep-text-light)', marginBottom: 8 }}>{t('bmi_gauge_title')}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    {[['<18.5','Bajo','#2196F3'],['18.5–25','Normal','#4CAF50'],['25–30','Sobre','#FF9800'],['>30','Obesidad','#F44336']].map(([range, label, color]) => (
                      <div key={range} style={{ textAlign: 'center' }}>
                        <div style={{ color, fontWeight: 600 }}>{label}</div>
                        <div style={{ color: 'var(--pep-text-light)', fontSize: 10 }}>{range}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--pep-purple)' }}>{bmi.toFixed(1)}</span>
                    <span style={{ fontSize: 13, color: 'var(--pep-text-light)', marginLeft: 4 }}>IMC</span>
                  </div>
                </div>
              )}

              {/* Achievements */}
              <div className="pep-card" style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--pep-purple)' }}>{t('progress_achievements')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {achievements.map(a => (
                    <div key={a.id} style={{ textAlign: 'center', opacity: a.earned ? 1 : 0.35 }}>
                      <div style={{ fontSize: 28 }}>{a.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pep-purple)' }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--pep-text-light)' }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}
