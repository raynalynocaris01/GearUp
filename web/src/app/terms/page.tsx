import Link from 'next/link';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { ScrollToTop } from '@/components/ScrollToTop';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function TermsPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#fcfdfa] flex flex-col">
      <Navbar user={user} />
      
      <div className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <Link 
          href="/signup" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gearup-600 transition mb-8"
        >
          <span className="text-xl">&larr;</span> Back to Sign Up
        </Link>

        <h1 className="text-4xl font-black text-gray-900 mb-2">Terms and Conditions</h1>
        <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-green max-w-none text-gray-600 space-y-6">
          <p>
            Welcome to GearUp, an outdoor adventure management system that connects campers and outdoor enthusiasts with campsite owners, campsite operators, and local tour guides.
          </p>
          <p>
            By accessing or using GearUp through its website or mobile application, you agree to these Terms and Conditions.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>
            By creating an account, browsing the platform, making a campsite booking, hiring a local tour guide, or using any other GearUp service, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">2. Eligibility</h2>
          <p>Users must provide accurate and complete information when creating an account or making a booking.</p>
          <p>Users are responsible for maintaining the confidentiality of their account information and for all activities performed through their account.</p>
          <p>If a user is below the required age for a particular service, permission or supervision from a parent or legal guardian may be required.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">3. GearUp Services</h2>
          <p>GearUp provides a platform where users may:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Book campsites.</li>
            <li>Hire local tour guides.</li>
            <li>View camping locations and destination information.</li>
            <li>View campsite information and availability.</li>
            <li>Read campsite reviews and ratings.</li>
          </ul>
          <p>GearUp connects campers and outdoor enthusiasts with campsite owners, campsite operators, and local tour guides.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">4. User Responsibilities</h2>
          <p>Users agree to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide truthful and accurate information.</li>
            <li>Use GearUp only for lawful purposes.</li>
            <li>Follow campsite rules and regulations.</li>
            <li>Follow reasonable instructions provided by campsite operators and tour guides.</li>
            <li>Arrive at booked locations at the agreed time.</li>
            <li>Pay applicable booking fees and charges.</li>
            <li>Respect campsite operators, tour guides, and other users.</li>
            <li>Respect the environment and local communities.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">5. Campsite and Tour Guide Responsibilities</h2>
          <p>Campsite owners, campsite operators, and local tour guides using GearUp are responsible for providing accurate information about their services, including: Location, Availability, Prices, Schedules, Rules and requirements, and Services offered.</p>
          <p>Service providers are responsible for fulfilling confirmed bookings and providing services according to their stated policies.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">6. Bookings and Reservations</h2>
          <p>Users may make campsite reservations and book tour guide services through GearUp.</p>
          <p>A booking is considered confirmed only when the system indicates that the reservation has been successfully completed.</p>
          <p>Users are responsible for reviewing booking information before confirming a reservation.</p>
          <p>GearUp may charge applicable booking or service fees, which will be displayed before the transaction is completed.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">7. Cancellation and Refunds</h2>
          <p>Cancellation and refund policies may vary depending on the campsite or tour guide.</p>
          <p>Users should review the applicable cancellation and refund policy before confirming a booking.</p>
          <p>Where applicable, refunds will be processed according to the service provider's stated policy and GearUp's procedures.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">8. Tour Guide Services</h2>
          <p>Local tour guides listed on GearUp are responsible for providing the services described in their listings.</p>
          <p>Users must follow reasonable instructions provided by tour guides during the service.</p>
          <p>GearUp does not guarantee the quality, availability, or suitability of every tour guide service listed on the platform.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">9. Payments and Fees</h2>
          <p>GearUp may generate revenue through booking fees, premium listings, and advertisements.</p>
          <p>Users agree to pay all applicable booking fees and other charges displayed during a transaction.</p>
          <p>All payment information provided by users must be accurate and authorized.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">10. Reviews and User-Generated Content</h2>
          <p>Users may submit reviews, ratings, comments, photos, or other content where these features are available.</p>
          <p>Users must ensure that submitted content is truthful, relevant, and does not contain unlawful, abusive, misleading, or inappropriate material.</p>
          <p>GearUp may remove content that violates these Terms and Conditions.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">11. Privacy and Personal Information</h2>
          <p>GearUp may collect information necessary to provide its services, such as account information, booking information, and transaction details.</p>
          <p>Personal information will be handled according to GearUp's applicable Privacy Policy and data-protection requirements.</p>
          <p>Users should avoid publicly sharing sensitive personal information through reviews, comments, or other platform features.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">12. Accuracy of Information</h2>
          <p>GearUp aims to provide accurate information about campsites, tour guides, and destinations.</p>
          <p>However, information may be provided or updated by campsite operators, tour guides, or other authorized users.</p>
          <p>GearUp does not guarantee that all information will always be complete, accurate, or current.</p>
        </div>
      </div>
      
      <ScrollToTop />
    </div>
  );
}