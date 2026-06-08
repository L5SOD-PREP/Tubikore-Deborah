import { Link } from 'react-router-dom';
import { Zap, Shield, TrendingUp, Users, Car, Tag, ArrowRight } from 'lucide-react';

function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 md:py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 no-underline text-black font-bold text-base">
            <Zap size={24} />
            <span>SwiftWheels <small className="font-normal text-[0.65rem] text-gray-400 uppercase tracking-[1px] ml-0.5">PMS</small></span>
          </Link>
          <div className="flex gap-2">
            <Link to="/login" className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400">Sign In</Link>
            <Link to="/register" className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 md:px-8 pt-20 pb-15 md:pt-25 md:pb-20 overflow-hidden bg-black">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.04) 0%, transparent 60%), radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 50%)'
        }} />
        <div className="relative max-w-[800px] text-center text-white">
          <span className="inline-block px-4 py-1.5 rounded-full text-[0.7rem] font-medium bg-white/10 text-white/80 mb-5 tracking-[0.3px]">🚀 Promotion & Marketing Subsystem</span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight mb-4 tracking-tight">
            Drive Your Business <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Forward</span>
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-white/60 leading-relaxed max-w-[600px] mx-auto mb-7">
            SwiftWheels PMS empowers you to manage vehicle promotions, track customer relationships, and generate powerful reports — all in one streamlined platform.
          </p>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 max-w-[320px] md:max-w-none mx-auto md:justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-1.5 px-7 py-3.5 text-sm rounded-md font-medium cursor-pointer transition-all min-h-[44px] bg-white text-black hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-1.5 px-7 py-3.5 text-sm rounded-md font-medium cursor-pointer transition-all min-h-[44px] bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:border-white/30 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
              Sign In
            </Link>
          </div>

          {/* Stats bar */}
          <div className="flex flex-col md:flex-row md:justify-center mt-9 p-5 bg-white/5 rounded-2xl border border-white/10 md:gap-0">
            {[{ num: '15+', label: 'Vehicles' }, { num: '12+', label: 'Customers' }, { num: '8+', label: 'Promotions' }, { num: '100%', label: 'Satisfaction' }].map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center gap-0.5 md:px-9">
                <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{stat.num}</span>
                <span className="text-[0.7rem] text-white/40 uppercase tracking-[1px]">{stat.label}</span>
                {i < 3 && <div className="hidden md:block w-px h-10 bg-white/10 absolute right-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-15 md:py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-9">
            <h2 className="text-2xl md:text-[1.75rem] font-bold text-black tracking-tight mb-2.5">Everything You Need</h2>
            <p className="text-sm text-gray-500">Powerful tools to manage your automotive promotions and marketing</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[
              { icon: Car, title: 'Vehicle Management', desc: 'Track your entire fleet with detailed records, status updates, and real-time inventory management.' },
              { icon: Users, title: 'Customer Relations', desc: 'Build stronger relationships with comprehensive customer profiles and contact management.' },
              { icon: Tag, title: 'Promotion Campaigns', desc: 'Create and manage discount campaigns across multiple types — percentage, flat rate, BOGO, and more.' },
              { icon: TrendingUp, title: 'Smart Reports', desc: 'Generate professional PDF and Excel reports with cross-entity insights, exportable and printable.' },
              { icon: Shield, title: 'Role-Based Access', desc: 'Granular permissions with admin, staff, and viewer roles to keep your data secure.' },
              { icon: Zap, title: 'Real-Time Search', desc: 'Find anything instantly with real-time search and filtering across all your data.' },
            ].map((feat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 transition-all hover:-translate-y-1 hover:shadow-md hover:border-gray-300">
                <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-black text-white mb-4"><feat.icon size={28} /></div>
                <h3 className="text-sm font-semibold mb-2 text-black">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-15 md:py-20 px-4 md:px-8 bg-black text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-2xl md:text-[1.75rem] font-bold text-white tracking-tight mb-2.5">Ready to Transform Your Marketing?</h2>
          <p className="text-sm text-white/60 mb-6">Join SwiftWheels PMS and take control of your promotions today.</p>
          <Link to="/register" className="inline-flex items-center justify-center gap-1.5 px-7 py-3.5 text-sm rounded-md font-medium cursor-pointer transition-all min-h-[44px] bg-white text-black hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 px-4 md:px-8 bg-neutral-950 text-center">
        <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} SwiftWheels Enterprises. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
