'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LiveRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#080a10] text-slate-400">
      Redirecting to Dashboard...
    </div>
  );
}
