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

export const uploadMedia = async (file) => {
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).substr(2,9)}.${ext}`
  const { data, error } = await supabase.storage
    .from('somalia2040-media')
    .upload(filename, file, { cacheControl: '3600', upsert: false })
  if (error) { console.error(error); return null; }
  const { data: urlData } = supabase.storage.from('somalia2040-media').getPublicUrl(filename)
  return { url: urlData.publicUrl, path: filename, name: file.name, size: file.size }
}

export const deleteMedia = async (path) => {
  const { error } = await supabase.storage.from('somalia2040-media').remove([path])
  if (error) console.error(error)
}

export const listMedia = async () => {
  const { data, error } = await supabase.storage.from('somalia2040-media').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) { console.error(error); return []; }
  return (data || []).map(f => ({
    name: f.name,
    path: f.name,
    url: supabase.storage.from('somalia2040-media').getPublicUrl(f.name).data.publicUrl,
    size: f.metadata?.size || 0,
    created_at: f.created_at,
  }))
}

/* ─── ANALYTICS ─────────────────────────────────────────────── */
const getSessionId = () => {
  let sid = sessionStorage.getItem('s2040_sid');
  if (!sid) { sid = Math.random().toString(36).substr(2, 12); sessionStorage.setItem('s2040_sid', sid); }
  return sid;
};

const getDevice = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
};

export const trackEvent = async (eventType, data = {}) => {
  try {
    await supabase.from('somalia_analytics').insert({
      event_type: eventType,
      page: data.page || window.location.pathname,
      post_id: data.post_id || null,
      session_id: getSessionId(),
      device: getDevice(),
      referrer: document.referrer || null,
      country: data.country || null,
      duration_seconds: data.duration || null,
    });
  } catch (e) { console.error('Analytics error:', e); }
};

export const getAnalytics = async (days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('somalia_analytics')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error) console.error(error);
  return data || [];
};

export const getAnalyticsSummary = async (days = 30) => {
  const data = await getAnalytics(days);
  const pageViews = data.filter(e => e.event_type === 'page_view');
  const sessions = [...new Set(data.map(e => e.session_id))];
  const devices = { mobile: 0, desktop: 0, tablet: 0 };
  const pages = {};
  const daily = {};
  const referrers = {};

  data.forEach(e => {
    if (e.device) devices[e.device] = (devices[e.device] || 0) + 1;
    if (e.page) pages[e.page] = (pages[e.page] || 0) + 1;
    if (e.referrer) referrers[e.referrer] = (referrers[e.referrer] || 0) + 1;
    const day = e.created_at?.split('T')[0];
    if (day) daily[day] = (daily[day] || 0) + 1;
  });

  return {
    totalViews: pageViews.length,
    uniqueSessions: sessions.length,
    devices,
    topPages: Object.entries(pages).sort((a,b)=>b[1]-a[1]).slice(0,10),
    topReferrers: Object.entries(referrers).sort((a,b)=>b[1]-a[1]).slice(0,5),
    dailyViews: Object.entries(daily).sort((a,b)=>a[0].localeCompare(b[0])).slice(-30),
  };
};

/* ─── ANNOUNCEMENTS ──────────────────────────────────────────── */
export const getAnnouncement = async () => {
  const { data } = await supabase.from('somalia_announcements').select('*').eq('active', true).single();
  return data || null;
};

export const saveAnnouncement = async (msg, color) => {
  await supabase.from('somalia_announcements').update({ active: false }).neq('id', -1);
  if (msg) {
    const { data } = await supabase.from('somalia_announcements').insert({ message: msg, color: color || '#4FC3F7', active: true }).select();
    return data?.[0];
  }
};

export const clearAnnouncement = async () => {
  await supabase.from('somalia_announcements').update({ active: false }).neq('id', -1);
};

/* ─── SCHEDULED POSTS ────────────────────────────────────────── */
export const publishScheduledPosts = async () => {
  const now = new Date().toISOString();
  const { data } = await supabase.from('somalia_posts').select('id').eq('published', false).lte('scheduled_at', now).not('scheduled_at', 'is', null);
  if (data && data.length > 0) {
    for (const p of data) {
      await supabase.from('somalia_posts').update({ published: true }).eq('id', p.id);
    }
  }
  return data?.length || 0;
};

/* ─── AUTH ───────────────────────────────────────────────────── */
export const signUp = async (email, password, displayName) => {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: displayName } }
  });
  if (error) return { error };
  if (data.user) {
    await supabase.from('somalia_profiles').upsert({
      id: data.user.id,
      display_name: displayName,
      username: email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4),
    });
  }
  return { user: data.user, session: data.session };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error };
  return { user: data.user, session: data.session };
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const getProfile = async (userId) => {
  const { data } = await supabase.from('somalia_profiles').select('*').eq('id', userId).single();
  return data;
};

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase.from('somalia_profiles').update(updates).eq('id', userId).select();
  if (error) console.error(error);
  return data?.[0];
};

export const savePostForUser = async (userId, postId) => {
  const { error } = await supabase.from('somalia_saved_posts').upsert({ user_id: userId, post_id: postId });
  if (error) console.error(error);
};

export const unsavePostForUser = async (userId, postId) => {
  await supabase.from('somalia_saved_posts').delete().eq('user_id', userId).eq('post_id', postId);
};

export const getUserSavedPosts = async (userId) => {
  const { data } = await supabase.from('somalia_saved_posts').select('post_id').eq('user_id', userId);
  return (data || []).map(r => r.post_id);
};

export const checkPostSaved = async (userId, postId) => {
  const { data } = await supabase.from('somalia_saved_posts').select('id').eq('user_id', userId).eq('post_id', postId).single();
  return !!data;
};
