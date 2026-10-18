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

export default async function PrivacyPage() {
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

        <h1 className="text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-green max-w-none text-gray-600 space-y-6">
          <p>
            GearUp respects your privacy and is committed to protecting the personal information of its users. This Privacy Policy explains how GearUp collects, uses, stores, and protects information when you use the GearUp website or mobile application.
          </p>
          <p>
            By using GearUp, you agree to the practices described in this Privacy Policy.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
          <p>GearUp may collect information that users provide when creating an account, making a booking, or using the platform. This may include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Full name</li>
            <li>Email address</li>
            <li>Contact number</li>
            <li>Account username and password</li>
            <li>Booking information</li>
            <li>Campsite reservation details</li>
            <li>Tour guide booking details</li>
            <li>Reviews and ratings</li>
            <li>Other information voluntarily provided by the user</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">2. Information Collected Automatically</h2>
          <p>When you use GearUp, the system may automatically collect certain technical information, such as:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Device type</li>
            <li>Operating system</li>
            <li>Browser or application information</li>
            <li>Date and time of system access</li>
            <li>Basic usage information</li>
            <li>IP address, where applicable</li>
          </ul>
          <p>This information may be used to maintain, secure, and improve the GearUp system.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">3. How We Use Your Information</h2>
          <p>GearUp may use collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage user accounts.</li>
            <li>Process campsite bookings.</li>
            <li>Process tour guide bookings.</li>
            <li>Communicate with users regarding their bookings.</li>
            <li>Provide customer support.</li>
            <li>Display reviews and ratings.</li>
            <li>Improve the functionality and performance of the system.</li>
            <li>Maintain system security.</li>
            <li>Detect and prevent fraudulent or unauthorized activities.</li>
            <li>Provide important updates regarding the GearUp service.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">4. Sharing of Information</h2>
          <p>GearUp may share necessary information with relevant service providers when required to complete a booking or provide a requested service.</p>
          <p>For example, information necessary for a campsite reservation may be shared with the applicable campsite owner or operator.</p>
          <p>Information necessary for a tour guide booking may be shared with the applicable tour guide.</p>
          <p>GearUp will not sell users' personal information to third parties.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">5. Reviews and Public Information</h2>
          <p>If users submit reviews, ratings, or other content intended to be publicly displayed, that information may be visible to other GearUp users.</p>
          <p>Users should avoid including sensitive personal information in public reviews or other publicly accessible content.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">6. Payment Information</h2>
          <p>If GearUp provides payment functionality, payment information may be processed through the applicable payment service provider.</p>
          <p>GearUp will only collect or retain payment information to the extent necessary for providing its services and processing transactions.</p>
          <p>Users should review the privacy policy of the applicable payment provider for information about how payment information is handled.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">7. Data Security</h2>
          <p>GearUp takes reasonable measures to protect users' personal information from unauthorized access, disclosure, alteration, or destruction.</p>
          <p>However, no online system can guarantee complete security. Users are responsible for keeping their account credentials confidential and should notify GearUp if they believe their account has been compromised.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">8. Data Retention</h2>
          <p>GearUp may retain personal information for as long as necessary to provide its services, maintain user accounts, process transactions, comply with applicable requirements, and resolve disputes.</p>
          <p>When information is no longer necessary, GearUp may delete or securely dispose of it in accordance with applicable policies and requirements.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">9. User Rights</h2>
          <p>Subject to applicable laws and regulations, users may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Request access to their personal information.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion of certain personal information.</li>
            <li>Withdraw consent where applicable.</li>
            <li>Ask how their personal information is being used.</li>
            <li>Raise concerns about the handling of their personal information.</li>
          </ul>
          <p>Users may contact GearUp using the contact information provided below to make a privacy-related request.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">10. Cookies and Similar Technologies</h2>
          <p>GearUp may use cookies or similar technologies to help maintain user sessions, remember preferences, improve system functionality, and understand how users interact with the platform.</p>
          <p>Users may be able to control cookies through their browser or device settings.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">11. Children's Privacy</h2>
          <p>GearUp is not intended to collect unnecessary personal information from children.</p>
          <p>If a user is below the applicable age for using a particular service, parental or guardian permission may be required.</p>
          <p>If GearUp becomes aware that personal information has been collected from a child without appropriate permission, reasonable steps may be taken to address the situation.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">12. Third-Party Services</h2>
          <p>GearUp may use third-party services to support certain functions of the platform, such as payment processing, hosting, analytics, authentication, or communication.</p>
          <p>These third-party providers may process information according to their own privacy policies.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">13. Changes to This Privacy Policy</h2>
          <p>GearUp may update this Privacy Policy from time to time to reflect changes to the system, services, or applicable requirements.</p>
          <p>The updated Privacy Policy will be made available through the GearUp platform.</p>
          <p>Users are encouraged to review this Privacy Policy periodically.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">14. Contact Us</h2>
          <p>If you have questions, concerns, or requests regarding this Privacy Policy, you may contact:</p>
          <p>
            GearUp Support<br />
            Email: gearupsystem@gmail.com<br />
            Phone: <br />
            Address: Metro Dumaguete College, E.J. Blanco Drive Extension, Daro, Dumaguete City, Negros Oriental 6200, Philippines.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">15. Consent</h2>
          <p>By using GearUp, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of your information as described above, subject to applicable laws and regulations.</p>
          <p className="font-semibold text-gearup-700 mt-8">GearUp – Camp. Explore. Adventure.</p>
        </div>
      </div>
      
      <ScrollToTop />
    </div>
  );
}