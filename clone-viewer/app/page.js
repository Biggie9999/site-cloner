export default function Page() {
  return (
    <div className="bg-white">
      {/* HERO SECTION */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 lg:pt-48 lg:pb-40 flex flex-col items-center text-center">
        <h2 className="text-[#ab9ff2] font-semibold tracking-wide uppercase text-sm mb-4">
          The money app that'll take you places
        </h2>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-[#121212] tracking-tight leading-tight max-w-4xl mb-10">
          Your home for trading crypto, predictions, and more
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <a href="/login" className="bg-[#ab9ff2] hover:bg-[#9d8ff0] text-[#121212] text-lg font-bold py-4 px-10 rounded-full flex items-center gap-3 transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Set up account
            </a>
            <a href="/login" className="bg-[#222] hover:bg-[#333] text-white border border-[#444] text-lg font-bold py-4 px-10 rounded-full flex items-center gap-3 transition-all">
              Log in
            </a>
        </div>

        {/* Hero Background Videos (Absolute positioned behind text) */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none opacity-50">
          <video src="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/38c2333eba4d9d1fad29f95be26fa039f35806bb.mp4" autoPlay loop muted playsInline className="absolute top-1/4 left-10 w-64 md:w-96 rounded-[3rem] mix-blend-screen" />
          <video src="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/0fd0e03172de808200c918dbb320de510c59f63a.mp4" autoPlay loop muted playsInline className="absolute top-1/3 right-10 w-64 md:w-96 rounded-[3rem] mix-blend-screen" />
        </div>
      </section>

      {/* TRADING TOOLS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <h2 className="text-4xl md:text-6xl font-bold text-[#121212] max-w-lg leading-tight">
            Trading tools for everyone
          </h2>
          <a href="/login" className="text-[#ab9ff2] hover:text-white font-semibold flex items-center gap-2 transition-colors">
            See more
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

        {/* Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card 
            title="Buy and sell all types of crypto in an instant." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/7913befe680b9eafa0b0cacccfdb0ae0d6eaeaae.mp4" 
            bgColor="bg-[#ab9ff2]" 
            textColor="text-[#121212]"
          />
          <Card 
            title="Find trending tokens, top traders, and apps." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/a4bc8e122086a96457f705f45db49dcd8321594b.mp4" 
            bgColor="bg-[#242424]" 
          />
          <Card 
            title="Trade big moments in culture with Prediction Markets." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/aa58f8b0124cc9024f49488e10b56f3c21312ad5.mp4" 
            bgColor="bg-[#2a2a2a]" 
          />
          <Card 
            title="Go long, go short, go anywhere with Perps." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/b2672e7ff735c6fc5b7b37d2e3495483f3fbd911.mp4" 
            bgColor="bg-[#1e1e1e]" 
          />
          <Card 
            title="Access powerful trading tools on desktop with Terminal." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/64646a33f6fea1b18807ffc0aa68b4b639ba68ae.mp4" 
            bgColor="bg-[#303030]" 
          />
        </div>
      </section>

      {/* MOVE MONEY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <h2 className="text-4xl md:text-6xl font-bold text-[#121212] max-w-lg leading-tight">
            Spend, Send, & Save
          </h2>
          <a href="/login" className="text-[#ab9ff2] hover:text-white font-semibold flex items-center gap-2 transition-colors">
            See more
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card 
            title="One home for your money." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/6d637b70d386ac3f26458b7692ae43b8bfffd9d3.mp4" 
            bgColor="bg-[#83f4a4]" 
            textColor="text-[#121212]"
          />
          <Card 
            title="Send money in seconds. Even pay friends." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/e33eef95b148eadfe686f60579610ccffc6bad1c.mp4" 
            bgColor="bg-[#242424]" 
          />
          <Card 
            title="Spend wherever Apple Pay, Google Pay, or VISA is accepted." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/2001bd877c20852e73cc761282695d3f72f0df5c.mp4" 
            bgColor="bg-[#2a2a2a]" 
          />
        </div>
      </section>

      {/* SECURITY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <h2 className="text-4xl md:text-6xl font-bold text-[#121212] max-w-lg leading-tight">
            Controlled by you, secured by us
          </h2>
          <a href="/login" className="text-[#ab9ff2] hover:text-white font-semibold flex items-center gap-2 transition-colors">
            See more
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card 
            title="Self-custodial means you control your funds. We never have access." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/56c73616b5ca840696e649a83602eff7ceeef5a5.mp4" 
            bgColor="bg-[#242424]" 
          />
          <Card 
            title="Our global Support team is here for you 24/7." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/4e00fe3afa259766cddf84cebba7a0f2fd9356b7.mp4" 
            bgColor="bg-[#1e1e1e]" 
          />
          <Card 
            title="Scam detection flags malicious transactions instantly." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/380ecb84fee71f4b8f5f22a29dc98fa73b917831.mp4" 
            bgColor="bg-[#2a2a2a]" 
          />
          <Card 
            title="Connect your Ledger to keep your crypto even safer." 
            video="https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/74f58521ae1d7925d27bcbdf45395a2274d11d7c.mp4" 
            bgColor="bg-[#303030]" 
          />
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <h3 className="text-[#ab9ff2] font-semibold mb-6">Trusted by a community of 20+ million users. It’s more than a wallet.</h3>
        <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-tight">
          Get started today.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <a href="/login" className="bg-[#ab9ff2] hover:bg-[#9d8ff0] text-[#121212] text-lg font-bold py-4 px-10 rounded-full flex items-center gap-3 transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Set up account
            </a>
            <a href="/login" className="bg-[#222] hover:bg-[#333] text-white border border-[#444] text-lg font-bold py-4 px-10 rounded-full flex items-center gap-3 transition-all">
              Log in
            </a>
        </div>
      </section>
    </div>
  );
}

// Reusable Card Component
function Card({ title, video, bgColor, textColor = "text-white" }) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-8 min-h-[400px] flex flex-col justify-between group transition-transform hover:-translate-y-2 cursor-pointer ${bgColor}`}>
      <h3 className={`text-2xl md:text-3xl font-bold leading-snug z-10 ${textColor}`}>
        {title}
      </h3>
      <div className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-80 mix-blend-screen scale-110 group-hover:scale-100 transition-transform duration-700">
        <video src={video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
