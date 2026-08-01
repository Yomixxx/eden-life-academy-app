'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const full_name = String(formData.get('full_name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const campus = String(formData.get('campus') || '') || null;
  const bio = String(formData.get('bio') || '').trim();

  if (!full_name) return { error: 'Full name is required.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name,
      phone: phone || null,
      campus,
      bio: bio || null,
    })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/profile');
  revalidatePath('/dashboard');
  return { success: true };
}
