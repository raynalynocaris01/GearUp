import Link from 'next/link';

export function AboutSection() {
  return (
    <section id="about" className="bg-[#fcfdfa] text-gray-800 font-sans py-20 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24 relative">
          
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-4">
              Explore. Camp.<br />
              Adventure<span className="text-gearup-600">.</span>
            </h1>
            
            <div className="flex items-end gap-4 mb-6">
              <h2 className="text-6xl md:text-7xl font-black text-gearup-700 tracking-tighter">
                GearUp
              </h2>
            </div>
            <p className="text-sm font-bold tracking-[0.2em] text-gray-500 uppercase mb-10">
              Explore &middot; Book &middot; Experience
            </p>

            {/* Doodle line */}
            <div className="w-48 h-2 bg-black rounded-full -rotate-2 mb-10 opacity-80" />
          </div>

          {/* Hero Image with curved mask illusion */}
          <div className="relative">
            <div className="absolute top-10 -left-4 z-0 opacity-60">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 10C25 15 10 20 10 30" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="relative z-10 w-full h-[400px] rounded-tl-[100px] rounded-br-[100px] overflow-hidden shadow-2xl">
              {/* Using your local image here */}
              <img 
                src="/hike.jpg" 
                alt="Hikers climbing a root-covered trail" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* 
              Note: Removed the floating script text here so it doesn't 
              overlap the photo. We can add it back if you find a good spot 
              that doesn't block the hikers.
            */}
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24">
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-bold text-gearup-800 mb-6">About GearUp</h3>
            <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
              <p>
                GearUp is a platform designed to make outdoor adventures easier, more convenient, and more enjoyable.
              </p>
              <p>
                We connect travelers with campsites, tour guides, gear rentals, and outdoor events — all in one place. Whether you're planning a weekend getaway or a bigger adventure, GearUp helps you get ready, explore more, and create lasting memories.
              </p>
            </div>
          </div>
          
          <div className="relative flex items-center justify-center">
            <div className="bg-gray-100 rounded-full w-64 h-64 flex items-center justify-center -rotate-6 shadow-sm">
              <p className="font-serif italic text-xl text-gray-700 text-center leading-snug rotate-6">
                Your next<br/>adventure<br/>starts here.
              </p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="bg-[#f3f6f1] rounded-3xl p-8 md:p-12 mb-24 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex gap-6 items-start">
              <div className="bg-white p-4 rounded-full shrink-0 shadow-sm">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e6b3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h4>
                <p className="text-gray-600 leading-relaxed">
                  Our mission is to provide a convenient, reliable, and all-in-one platform for outdoor enthusiasts. We aim to make it simple to find and book campsites, hire trusted tour guides, rent quality gear, and join exciting outdoor events — while supporting local communities and helping more people experience the beauty of nature.
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h4>
              <p className="text-gray-600 leading-relaxed">
                To be the leading gateway for outdoor exploration, fostering a community that respects nature, supports local tourism, and inspires everyone to step outside.
              </p>
            </div>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 shrink-0">What We Offer</h3>
            <div className="h-px bg-gray-300 w-full mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Book Campsites',
                desc: 'Find and reserve the perfect campsite, from mountains to lakes and hidden gems.',
                icon: <path d="M12 22l10-15H2L12 22z" />,
              },
              {
                title: 'Hire Tour Guide',
                desc: 'Connect with experienced tour guides who can show you the best routes, local spots, and hidden adventures.',
                icon: <><circle cx="12" cy="8" r="4"/><path d="M4 22v-4a8 8 0 0116 0v4"/><path d="M9 12l-2 10"/><path d="M15 12l2 10"/></>,
              },
              {
                title: 'Rent Gear',
                desc: 'Get the right equipment for your adventure — from tents and backpacks to hiking and camping gear.',
                icon: <><rect x="4" y="8" width="16" height="14" rx="2"/><path d="M8 8V4a4 4 0 018 0v4"/></>,
              },
            ].map((item, i) => (
              <div key={i} className={`text-center flex flex-col items-center ${i !== 2 ? 'lg:border-r lg:border-gray-200' : ''}`}>
                <div className="w-24 h-24 bg-[#f3f6f1] rounded-full flex items-center justify-center mb-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e6b3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                </div>
                <h5 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h5>
                <p className="text-sm text-gray-600 leading-relaxed px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
