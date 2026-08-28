import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mpdpbfaorquuqvhawwea.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZHBiZmFvcnF1dXF2aGF3d2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTkwMTAsImV4cCI6MjA5MDQ5NTAxMH0.MjqWGPBgWkRusMoRu_m47uZveVbKHXuCdQpBwx0Rmkk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signUp = (email: string, password: string, fullName?: string) =>
  supabase.auth.signUp({
    email,
    password,
    ...(fullName ? { options: { data: { full_name: fullName } } } : {}),
  })

export const resetPasswordForEmail = (email: string) =>
  supabase.auth.resetPasswordForEmail(email)

export const verifyOtp = (email: string, token: string) =>
  supabase.auth.verifyOtp({ email, token, type: 'email' })

export const resendOtp = (email: string) =>
  supabase.auth.resend({ type: 'signup', email })

export const signOut = () => supabase.auth.signOut()

export const getCurrentUser = () => supabase.auth.getUser()

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  auth_uid: string
  email?: string
  full_name?: string
  phone?: string
  birth_date?: string
  // La BD tiene CHECK (sex IN ('femenino','masculino')) — ver 01_schema.sql
  sex?: 'masculino' | 'femenino'
  height_cm?: number
  weight_kg?: number
  target_weight_kg?: number
  medications?: string
  // El panel del admin lee estas columnas; la PWA las mantiene sincronizadas
  // con weight_kg / target_weight_kg. Ver README del backup de Supabase.
  initial_weight_kg?: number
  current_weight_kg?: number
  goal_weight_kg?: number
  bmi?: number
  bmi_category?: string
  age?: number
  role?: string
  photo_url?: string
  preferred_language?: string
}

export const getProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_uid', user.id)
    .maybeSingle()
  return data
}

// Columnas que realmente existen en la tabla `profiles`.
// weight_unit / height_unit NO existen en Supabase: se guardan en localStorage.
const PROFILE_COLUMNS = [
  'email', 'full_name', 'phone', 'birth_date', 'sex', 'height_cm', 'weight_kg',
  'target_weight_kg', 'medications', 'role', 'photo_url', 'preferred_language',
] as const

// Filas y builds antiguos usan 'male'/'female'; la BD sólo acepta español.
export const normalizeSex = (value: unknown): Profile['sex'] | undefined => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (['masculino', 'male', 'hombre', 'm', 'h'].includes(raw)) return 'masculino'
  if (['femenino', 'female', 'mujer', 'f'].includes(raw)) return 'femenino'
  return undefined
}

const cleanProfilePayload = (updates: Partial<Profile>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {}
  for (const key of PROFILE_COLUMNS) {
    const value = key === 'sex' ? normalizeSex(updates.sex) : updates[key]
    if (value !== undefined) payload[key] = value
  }
  return payload
}

// `full_name` es NOT NULL en la BD. Si el formulario no lo trae, lo recuperamos
// de los metadatos del registro (o del email) para que el insert nunca falle.
const resolveFullName = (user: User, payload: Record<string, unknown>): string => {
  const candidates = [
    payload.full_name,
    user.user_metadata?.full_name,
    user.user_metadata?.name,
    user.user_metadata?.fullName,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  const emailLocalPart = (user.email ?? '').split('@')[0].trim()
  return emailLocalPart || 'Usuario'
}

// Mismas fórmulas y etiquetas que usa el panel del admin, para que ambos
// muestren exactamente el mismo IMC y la misma categoría.
export const calcBmi = (weightKg: number, heightCm: number): number =>
  Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1))

export const bmiCategory = (bmi: number): string =>
  bmi < 18.5 ? 'Bajo peso' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Sobrepeso' : 'Obesidad I'

const calcAge = (birthDate: string): number | undefined => {
  const born = new Date(birthDate)
  if (isNaN(born.getTime())) return undefined
  const today = new Date()
  let age = today.getFullYear() - born.getFullYear()
  const monthDiff = today.getMonth() - born.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) age--
  return age >= 0 && age < 130 ? age : undefined
}

const toNumber = (value: unknown): number | undefined => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

// Espeja weight_kg/target_weight_kg en las columnas del admin y recalcula los
// campos derivados, para que el nutricionista vea los mismos datos.
const withDerivedFields = (
  payload: Record<string, unknown>,
  current: Partial<Profile> | null,
): Record<string, unknown> => {
  const body = { ...payload }

  if (body.weight_kg !== undefined) {
    body.current_weight_kg = body.weight_kg
    // El peso inicial se fija una sola vez, al crear la ficha.
    if (current?.initial_weight_kg == null) body.initial_weight_kg = body.weight_kg
  }
  if (body.target_weight_kg !== undefined) body.goal_weight_kg = body.target_weight_kg

  const birthDate = (body.birth_date ?? current?.birth_date) as string | undefined
  if (birthDate) {
    const age = calcAge(birthDate)
    if (age !== undefined) body.age = age
  }

  const weight = toNumber(body.weight_kg ?? current?.weight_kg ?? current?.current_weight_kg)
  const height = toNumber(body.height_cm ?? current?.height_cm)
  if (weight && height) {
    const bmi = calcBmi(weight, height)
    body.bmi = bmi
    body.bmi_category = bmiCategory(bmi)
  }
  return body
}

const updateProfileRow = async (
  authUid: string,
  payload: Record<string, unknown>,
): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('auth_uid', authUid)
    .select()
    .single()
  if (error) throw error
  return data
}

export const upsertProfile = async (updates: Partial<Profile>): Promise<Profile> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const payload = cleanProfilePayload(updates)

  const existing = await supabase
    .from('profiles')
    .select('id, height_cm, weight_kg, current_weight_kg, initial_weight_kg, birth_date')
    .eq('auth_uid', user.id)
    .maybeSingle()
  if (existing.error) throw existing.error

  if (existing.data) {
    // Nada que actualizar: devolvemos el perfil tal cual está.
    if (Object.keys(payload).length === 0) {
      const current = await getProfile()
      if (!current) throw new Error('Profile not found')
      return current
    }
    return updateProfileRow(user.id, withDerivedFields(payload, existing.data))
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      ...withDerivedFields(payload, null),
      auth_uid: user.id,
      email: payload.email ?? user.email,
      full_name: resolveFullName(user, payload),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Puede ser una carrera (otra pestaña creó el perfil) o una colisión con
      // el UNIQUE de `email`: una ficha precargada por el admin sin auth_uid,
      // que RLS no nos deja reclamar desde el cliente.
      const retry = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_uid', user.id)
        .maybeSingle()
      if (retry.data) return updateProfileRow(user.id, payload)
      throw new Error(
        'Ya existe una ficha con este correo creada por tu nutricionista. ' +
        'Pídele que la vincule a tu cuenta para continuar.',
      )
    }
    throw error
  }
  return data
}

// ─── Measurements ─────────────────────────────────────────────────────────────

export interface Measurement {
  id: string
  patient_id: string
  measurement_date: string
  weight_kg?: number
  notes?: string
  photo_url?: string
}

export const getMeasurements = async (profileId: string): Promise<Measurement[]> => {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('patient_id', profileId)
    .order('measurement_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const addMeasurement = async (data: Omit<Measurement, 'id'>): Promise<Measurement> => {
  const { data: inserted, error } = await supabase
    .from('measurements')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return inserted
}

export const updateMeasurement = async (id: string, updates: Partial<Measurement>) => {
  const { error } = await supabase.from('measurements').update(updates).eq('id', id)
  if (error) throw error
}

export const deleteMeasurement = async (id: string) => {
  const { error } = await supabase.from('measurements').delete().eq('id', id)
  if (error) throw error
}

// Al registrar el pesaje más reciente, el admin actualiza el peso actual y el
// IMC del perfil. La PWA hace lo mismo para que ambos paneles coincidan.
export const syncProfileWeight = async (profile: Profile, weightKg: number) => {
  const updates: Partial<Profile> = {
    weight_kg: weightKg,
    current_weight_kg: weightKg,
  }
  if (profile.initial_weight_kg == null) updates.initial_weight_kg = weightKg
  const height = toNumber(profile.height_cm)
  if (height) {
    const bmi = calcBmi(weightKg, height)
    updates.bmi = bmi
    updates.bmi_category = bmiCategory(bmi)
  }
  const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
  if (error) throw error
}

// ─── Calendar Events ──────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string
  patient_id: string
  event_date: string
  title: string
  notes?: string
  event_type?: string
}

export const getCalendarEvents = async (profileId: string): Promise<CalendarEvent[]> => {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('patient_id', profileId)
    .order('event_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export const addCalendarEvent = async (data: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
  const { data: inserted, error } = await supabase
    .from('calendar_events')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return inserted
}

export const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
  const { error } = await supabase.from('calendar_events').update(updates).eq('id', id)
  if (error) throw error
}

export const deleteCalendarEvent = async (id: string) => {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw error
}

// ─── Tips ─────────────────────────────────────────────────────────────────────

export interface Tip {
  id: string
  title: string
  body: string
  category?: string
  is_published: boolean
  published_at?: string
  image_url?: string
}

export const getTips = async (): Promise<Tip[]> => {
  const { data, error } = await supabase
    .from('tips')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export const uploadPhoto = async (file: File, profileId: string): Promise<string> => {
  const fileName = `${profileId}/${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from('patient-photos')
    .upload(fileName, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('patient-photos').getPublicUrl(fileName).data.publicUrl
}
