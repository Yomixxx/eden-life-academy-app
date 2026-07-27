'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToDevotions, unsubscribeFromDevotions } from '@/app/actions/devotions';

export default function DevotionSubscribeToggle({ subscribed }: { subscribed: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      await (subscribed ? unsubscribeFromDevotions() : subscribeToDevotions());
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={handleToggle}
      disabled={pending}
      style={{ fontSize: '.78rem' }}
    >
      {pending ? 'Saving…' : subscribed ? 'Unsubscribe from daily devotions' : 'Get this every morning by email'}
    </button>
  );
}
