import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';

function Register() {
  const [form, setForm] = useState({
    username: '', password: '', confirmPassword: '', email: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/register', {
        username: form.username,
        password: form.password,
        email: form.email,
        role: 'staff'
      });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.error 
        || err.response?.data?.details?.[0]?.message 
        || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      {/* Animated background — only on md+ */}
      <div className="hidden md:block absolute top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none animate-[loginBgShift_20s_ease-in-out_infinite_alternate]"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.04) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)'
        }}
      />
      <div className="bg-white rounded-2xl w-full max-w-[400px] mx-4 p-8 md:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.5)] relative overflow-y-auto max-h-screen">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors mb-5 no-underline">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="text-center mb-7">
          <div className="text-4xl mb-2.5"><UserPlus size={36} /></div>
          <h1 className="text-xl font-bold text-black tracking-tight">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Join SwiftWheels Promotion & Marketing Subsystem</p>
        </div>

        {error && <div className="p-3 rounded-lg mb-4 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">{error}</div>}
        {success && <div className="p-3 rounded-lg mb-4 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">{success}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3px]">Username</label>
            <input
              id="username" name="username" type="text"
              value={form.username} onChange={handleChange}
              placeholder="Choose a username" required autoFocus
              className="w-full p-3.5 text-base border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3px]">Email</label>
            <input
              id="email" name="email" type="email"
              value={form.email} onChange={handleChange}
              placeholder="your@email.com" required
              className="w-full p-3.5 text-base border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3px]">Password</label>
            <div className="relative">
              <input
                id="password" name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                placeholder="Min. 6 characters" required
                className="w-full p-3.5 pr-11 text-base border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-1.5 bg-transparent border-none cursor-pointer transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3px]">Confirm Password</label>
            <input
              id="confirmPassword" name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword} onChange={handleChange}
              placeholder="Repeat your password" required
              className="w-full p-3.5 text-base border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-xs font-semibold text-black hover:underline no-underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
