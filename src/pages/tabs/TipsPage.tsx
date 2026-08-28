import { useEffect, useState } from 'react'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSpinner, IonRefresher, IonRefresherContent, IonButton, IonIcon, IonAlert, IonModal
} from '@ionic/react'
import { trashOutline, closeOutline } from 'ionicons/icons'
import { useTranslation } from 'react-i18next'
import { getTips, deleteTip, type Tip } from '../../services/supabase'

const CATEGORY_COLORS: Record<string, string> = {
  tip:         '#7B2D8B',
  sugerencia:  '#5a1f66',
  nutricion:   '#4CAF50',
  ejercicio:   '#2196F3',
  motivacion:  '#FF9800',
  hidratacion: '#00BCD4',
  general:     '#9E9E9E',
}

function catColor(cat?: string) {
  return CATEGORY_COLORS[cat?.toLowerCase() ?? 'general'] ?? '#9E9E9E'
}

export default function TipsPage() {
  const { t } = useTranslation()
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const load = async () => {
    try { setTips(await getTips()) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    try {
      await deleteTip(id)
      setTips(prev => prev.filter(t => t.id !== id))
    } catch (e: any) {
      console.error('[tips] no se pudo eliminar el tip', e)
      setDeleteError(e?.message ?? 'No se pudo eliminar el tip.')
    }
  }

  const catLabel = (cat?: string) => {
    const key = `tips_cat_${cat?.toLowerCase() ?? 'general'}`
    return t(key, cat ?? 'General')
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <div style={{ lineHeight: 1.2, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t('app_name')}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{t('tips_title')}</div>
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
          ) : tips.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--pep-text-light)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💡</div>
              <p style={{ fontWeight: 600 }}>{t('tips_empty')}</p>
              <p style={{ fontSize: 13 }}>{t('tips_empty_hint')}</p>
            </div>
          ) : (
            tips.map(tip => (
              <div key={tip.id} className="pep-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, color: 'var(--pep-purple)', fontSize: 16, fontWeight: 700, flex: 1 }}>
                    {tip.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11,
                      fontWeight: 600, color: '#fff', background: catColor(tip.category)
                    }}>
                      {catLabel(tip.category)}
                    </span>
                    <IonButton fill="clear" size="small" onClick={() => setDeleteTarget(tip.id)}>
                      <IonIcon icon={trashOutline} color="danger" style={{ fontSize: 16 }} />
                    </IonButton>
                  </div>
                </div>

                {tip.image_url && (
                  <img
                    src={tip.image_url}
                    alt={tip.title}
                    onClick={() => setLightboxUrl(tip.image_url!)}
                    style={{ width: '100%', borderRadius: 10, marginBottom: 10, objectFit: 'cover', maxHeight: 200, cursor: 'pointer' }}
                  />
                )}

                <p style={{ margin: 0, color: 'var(--pep-text)', fontSize: 14, lineHeight: 1.5 }}>
                  {tip.body}
                </p>
                {tip.published_at && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--pep-text-light)' }}>
                    {new Date(tip.published_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <IonAlert
          isOpen={!!deleteError}
          onDidDismiss={() => setDeleteError('')}
          header={t('error')}
          message={deleteError}
          buttons={['OK']}
        />

        <IonAlert
          isOpen={!!deleteTarget}
          header={t('tips_delete_title')}
          message={t('tips_delete_confirm')}
          buttons={[
            { text: t('cancel'), role: 'cancel', handler: () => setDeleteTarget(null) },
            { text: t('delete'), role: 'destructive', handler: () => { handleDelete(deleteTarget!); setDeleteTarget(null) } }
          ]}
          onDidDismiss={() => setDeleteTarget(null)}
        />

        {/* Lightbox */}
        <IonModal isOpen={!!lightboxUrl} onDidDismiss={() => setLightboxUrl(null)}>
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IonButton
              fill="clear" color="light"
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
              onClick={() => setLightboxUrl(null)}
            >
              <IonIcon icon={closeOutline} style={{ fontSize: 28 }} />
            </IonButton>
            {lightboxUrl && (
              <img
                src={lightboxUrl}
                alt="imagen"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            )}
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  )
}
