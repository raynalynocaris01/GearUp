'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  href: string;
  seconds?: number;
}

export function AutoRedirect({ href, seconds = 5 }: Props) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);

    const timeout = setTimeout(() => {
      router.push(href);
    }, seconds * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [href, seconds, router]);

  return (
    <p className="text-center text-xs text-gray-400 mt-6">
      Redirecting to your booking details in {remaining}s...
    </p>
  );
}