import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication | FoodLink',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 30% 40%, #22c55e 0%, transparent 50%),
                            radial-gradient(circle at 70% 60%, #0ea5e9 0%, transparent 50%)`,
        }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M8 12s1-2 4-2 4 2 4 2" strokeLinecap="round" />
                <path d="M12 8v1M12 15v1" strokeLinecap="round" />
              </svg>
            </div>
            <span className=" font-display font-bold text-xl text-white">FoodLink</span>
          </div>

          {/* Center content */}
          <div>
            <h1 className="ml-4 text-4xl font-display font-bold text-white leading-tight mb-4">
              Connecting surplus food<br />
              <span className="bg-gradient-to-r from-brand-300 to-emerald-300 bg-clip-text text-transparent">
                with hungry communities
              </span>
            </h1>
            <p className="ml-6 text-white/60 text-base leading-relaxed max-w-sm">
              Join thousands of hotels, NGOs, and volunteers working together to reduce food waste and fight hunger.
            </p>

            {/* flow */}
           <div className="mt-8 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-start gap-6">
              
              <div>
                <p className="text-xl font-display font-bold text-white">Donate</p>
                <p className="text-xs font-display text-white/50">Hotels</p>
              </div>

              <div className="text-white/30 text-xl">→</div>

              <div>
                <p className="text-xl font-display font-bold text-white">Connect</p>
                <p className="text-xs font-display text-white/50">NGOs</p>
              </div>

              <div className="text-white/30 text-xl">→</div>

              <div>
                <p className="text-xl font-display font-bold text-white">Deliver</p>
                <p className="text-xs font-display text-white/50">Volunteers</p>
              </div>

            </div>
          </div>
          </div>

          {/* Bottom quote */}
          <div className="bg-white/8 rounded-2xl p-5 border border-white/10">
            <p className="text-white/70 text-sm italic mb-3">
              One donation can feed many people.
              <br />
              FoodLink exists to make that connection faster, simpler, and more reliable.

            </p>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Platform Administrator</p>
                <p className="text-white/50 text-xs">FoodLink</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
