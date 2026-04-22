import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, Building2, Heart } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: '',
    city_name: '', state: '', pincode: '', contact: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/cities').then(r => setCities(r.data)).catch(() => {});
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.role) return toast.error('Please select a role.');
    setLoading(true);
    try {
      const res = await API.post('/auth/signup', form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome to FoodLink, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl shadow-lg mb-4">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-gray-900">Join FoodLink</h1>
          <p className="text-gray-500 mt-1">Create your account to get started</p>
        </div>

        {/* Role selector */}
        {!form.role ? (
          <div className="card shadow-lg">
            <h2 className="font-display font-semibold text-xl text-gray-800 text-center mb-6">I am a...</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setForm(f => ({ ...f, role: 'donor' }))}
                className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-brand-400 hover:bg-green-50 transition-all text-center"
              >
                <div className="w-14 h-14 mx-auto mb-3 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                  <Heart size={24} className="text-brand-600 group-hover:text-white transition-colors" />
                </div>
                <div className="font-semibold text-gray-800 group-hover:text-brand-700">Food Donor</div>
                <div className="text-xs text-gray-500 mt-1">Restaurant, hotel, individual</div>
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, role: 'ngo' }))}
                className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
              >
                <div className="w-14 h-14 mx-auto mb-3 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <Building2 size={24} className="text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div className="font-semibold text-gray-800 group-hover:text-blue-700">NGO / Charity</div>
                <div className="text-xs text-gray-500 mt-1">Non-profit, shelter, food bank</div>
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">Sign in</Link>
            </p>
          </div>
        ) : (
          <div className="card shadow-lg border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.role === 'donor' ? 'bg-green-100' : 'bg-blue-100'}`}>
                {form.role === 'donor'
                  ? <Heart size={20} className="text-brand-600" />
                  : <Building2 size={20} className="text-blue-600" />
                }
              </div>
              <div>
                <div className="font-semibold text-gray-900 capitalize">{form.role}</div>
                <button onClick={() => setForm(f => ({ ...f, role: '' }))} className="text-xs text-gray-400 hover:text-brand-600">
                  Change role
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full Name / Organization Name</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="input" required />
                </div>
                <div className="col-span-2">
                  <label className="label">Email Address</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input" required />
                </div>
                <div className="col-span-2">
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min. 6 characters"
                      className="input pr-10"
                      minLength={6}
                      required
                    />
                    <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">City</label>
                  <input
                    name="city_name"
                    value={form.city_name}
                    onChange={handleChange}
                    placeholder="Your city"
                    list="cities-list"
                    className="input"
                  />
                  <datalist id="cities-list">
                    {cities.map(c => <option key={c.city_id} value={c.city_name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="label">State</label>
                  <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input" />
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="6-digit PIN" className="input" maxLength={6} />
                </div>
                <div>
                  <label className="label">Contact Number</label>
                  <input name="contact" value={form.contact} onChange={handleChange} placeholder="Phone number" className="input" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3 mt-2">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">Sign in</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
