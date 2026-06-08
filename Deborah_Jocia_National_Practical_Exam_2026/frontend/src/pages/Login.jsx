import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Zap } from 'lucide-react';
import { validateLogin } from '../utils/validation';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const clearError = (field) => {
    if (formErrors[field]) setFormErrors(prev => { const u = { ...prev }; delete u[field]; return u; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormErrors({});
    const { valid, errors } = validateLogin({ username, password });
    if (!valid) { setFormErrors(errors); return; }
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { username, password });
      if (res.data.token) localStorage.setItem('pms_token', res.data.token);
      onLogin(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      {/* Animated background — only on md+ */}
      <div className="hidden md:block absolute top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none animate-[loginBgShift_20s_ease-in-out_infinite_alternate]"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.04) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)'
        }}
      />
      <div className="bg-white rounded-2xl w-full max-w-[400px] mx-4 p-8 md:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.5)] relative">
        <div className="text-center mb-7">
          <div className="text-4xl mb-2.5"><Zap size={36} /></div>
          <h1 className="text-xl font-bold text-black tracking-tight">SwiftWheels PMS</h1>
          <p className="text-sm text-gray-500 mt-1">Promotion & Marketing Subsystem</p>
        </div>

        {error && <div className="p-3 rounded-lg mb-4 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3px]">Username</label>
            <input
              id="username" type="text" value={username}
              onChange={(e) => { setUsername(e.target.value); clearError('username'); }}
              placeholder="Enter your username" required autoFocus
              className={`w-full p-3.5 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.username ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`}
            />
            {formErrors.username && <span className="text-xs text-red-600 font-medium">{formErrors.username}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3px]">Password</label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
              placeholder="Enter your password" required
              className={`w-full p-3.5 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.password ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`}
            />
            {formErrors.password && <span className="text-xs text-red-600 font-medium">{formErrors.password}</span>}
          </div>
          <button type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 bg-gray-50 p-2.5 rounded-lg leading-relaxed">
            Default credentials: <strong className="text-gray-500">admin</strong> / <strong className="text-gray-500">Admin@123</strong>
          </p>
          <p className="text-[0.65rem] text-gray-400 mt-2">(Configured via .env file)</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
