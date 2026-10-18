import Link from 'next/link';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
 import { AboutSection } from '@/components/AboutSection';
import { ScrollToTop } from '@/components/ScrollToTop';


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AboutPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#fcfdfa] flex flex-col">
      <Navbar user={user} />
      
      {/* 
        We add a little padding at the top so the content doesn't 
        hit the navbar, and wrap the AboutSection to center it.
      */}
      <div className="flex-1 pt-8 pb-16">
        <div className="max-w-6xl mx-auto px-6 mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gearup-600 transition"
          >
            <span className="text-xl">&larr;</span> Back to Home
          </Link>
        </div>
        
     {/* The main About Us content */}
        <AboutSection />
      </div>
      
      {/* Floating Back to Top Button */}
      <ScrollToTop />
    </div>
  );
}