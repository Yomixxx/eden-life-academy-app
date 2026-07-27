'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function subscribeToDevotions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: 'Not signed in.' };

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();

  const { error } = await supabase.from('devotion_subscribers').upsert(
    {
      user_id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? null,
      subscribed: true,
    },
    { onConflict: 'user_id' }
  );

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return {};
}

export async function unsubscribeFromDevotions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { error } = await supabase
    .from('devotion_subscribers')
    .update({ subscribed: false })
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return {};
}
