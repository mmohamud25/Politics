import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const getPosts = async () => {
  const { data, error } = await supabase
    .from('somalia_posts')
    .select('*, somalia_comments(*)')
    .order('created_at', { ascending: false })
  if (error) console.error(error)
  return data || []
}

export const savePost = async (post) => {
  if (post.id) {
    const { id, somalia_comments, ...rest } = post
    const { data, error } = await supabase.from('somalia_posts').update(rest).eq('id', id).select()
    if (error) console.error(error)
    return data?.[0]
  } else {
    const { somalia_comments, ...rest } = post
    const { data, error } = await supabase.from('somalia_posts').insert(rest).select()
    if (error) console.error(error)
    return data?.[0]
  }
}

export const deletePost = async (id) => {
  const { error } = await supabase.from('somalia_posts').delete().eq('id', id)
  if (error) console.error(error)
}

export const togglePostField = async (id, field, value) => {
  const { error } = await supabase.from('somalia_posts').update({ [field]: value }).eq('id', id)
  if (error) console.error(error)
}

export const incrementViews = async (id) => {
  const { data } = await supabase.from('somalia_posts').select('views').eq('id', id).single()
  await supabase.from('somalia_posts').update({ views: (data?.views || 0) + 1 }).eq('id', id)
}

export const addComment = async (comment) => {
  const { data, error } = await supabase.from('somalia_comments').insert(comment).select()
  if (error) console.error(error)
  return data?.[0]
}

export const approveComment = async (id) => {
  const { error } = await supabase.from('somalia_comments').update({ approved: true }).eq('id', id)
  if (error) console.error(error)
}

export const deleteComment = async (id) => {
  const { error } = await supabase.from('somalia_comments').delete().eq('id', id)
  if (error) console.error(error)
}

export const getVoices = async () => {
  const { data, error } = await supabase.from('somalia_voices').select('*').order('created_at', { ascending: false })
  if (error) console.error(error)
  return data || []
}

export const addVoice = async (voice) => {
  const { data, error } = await supabase.from('somalia_voices').insert(voice).select()
  if (error) console.error(error)
  return data?.[0]
}

export const toggleVoiceFeatured = async (id, featured) => {
  const { error } = await supabase.from('somalia_voices').update({ featured }).eq('id', id)
  if (error) console.error(error)
}

export const deleteVoice = async (id) => {
  const { error } = await supabase.from('somalia_voices').delete().eq('id', id)
  if (error) console.error(error)
}

export const getReading = async () => {
  const { data, error } = await supabase.from('somalia_reading').select('*').order('created_at', { ascending: true })
  if (error) console.error(error)
  return data || []
}

export const addBook = async (book) => {
  const { data, error } = await supabase.from('somalia_reading').insert(book).select()
  if (error) console.error(error)
  return data?.[0]
}

export const deleteBook = async (id) => {
  const { error } = await supabase.from('somalia_reading').delete().eq('id', id)
  if (error) console.error(error)
}

export const getSetting = async (key) => {
  const { data, error } = await supabase.from('somalia_settings').select('value').eq('key', key).single()
  if (error) console.error(error)
  return data?.value
}

export const setSetting = async (key, value) => {
  const { error } = await supabase.from('somalia_settings').upsert({ key, value })
  if (error) console.error(error)
}

export const getWordArchive = async () => {
  const { data, error } = await supabase.from('somalia_word_archive').select('*').order('created_at', { ascending: false })
  if (error) console.error(error)
  return data || []
}

export const addToWordArchive = async (word) => {
  const { data, error } = await supabase.from('somalia_word_archive').insert(word).select()
  if (error) console.error(error)
  return data?.[0]
}

export const setActiveWord = async (id, wordData) => {
  await supabase.from('somalia_word_archive').update({ active: false }).neq('id', -1)
  await supabase.from('somalia_word_archive').update({ active: true }).eq('id', id)
  await setSetting('word_of_week', { somali: wordData.somali, english: wordData.english, sentence: wordData.sentence })
}
