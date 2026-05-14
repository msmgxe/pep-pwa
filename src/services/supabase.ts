import { createClient } from '@supabase/supabase-js'

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
  sex?: 'male' | 'female' | 'other'
  height_cm?: number
  weight_kg?: number
  medications?: string
  role?: string
  photo_url?: string
  preferred_language?: string
  weight_unit?: 'kg' | 'lbs'
  height_unit?: 'cm' | 'ft'
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

export const upsertProfile = async (updates: Partial<Profile>): Promise<Profile> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const existing = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_uid', user.id)
    .maybeSingle()

  if (existing.data) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('auth_uid', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ ...updates, auth_uid: user.id, email: user.email })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ─── Measurements ─────────────────────────────────────────────────────────────

export interface Measurement {
  id: string
  patient_id: string
  measurement_date: string
  weight_kg?: number
  waist_cm?: number
  hip_cm?: number
  notes?: string
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

// ─── Calendar Events ──────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string
  patient_id: string
  event_date: string
  title: string
  description?: string
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
  content: string
  category?: string
  is_published: boolean
  published_at?: string
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
