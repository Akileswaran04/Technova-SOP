/**
 * Login / Signup screen — mocked local-only auth.
 * 
 * IMPORTANT: Passwords are stored in plaintext in localStorage.
 * TODO: Replace with real auth (bcrypt hashing, JWT tokens, server-side sessions).
 * The login ID is a simple hash of email/phone to identify the seller.
 */
import { useState } from 'react';
import { getSellers, createSeller, setSession } from '../services/storage';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Simple hash to create a seller ID from the identifier (not secure — demo only)
  const hashId = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'seller_' + Math.abs(hash).toString(36);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (mode === 'signup') {
      const existing = getSellers().find((s) => s.id === hashId(identifier.trim()));
      if (existing) {
        setError('An account with this email/phone already exists. Try logging in.');
        return;
      }
      const seller = createSeller({
        id: hashId(identifier.trim()),
        storeName: '',
        category: '',
        bio: '',
        phone: identifier.includes('@') ? '' : identifier.trim(),
        email: identifier.includes('@') ? identifier.trim() : '',
        address: '',
        hours: '',
        avatarImage: null,
        documents: [],
        password: password, // TODO: hash this in production
        createdAt: new Date().toISOString(),
      });
      setSession(seller.id);
      onLogin(seller);
    } else {
      const seller = getSellers().find((s) => s.id === hashId(identifier.trim()));
      if (!seller) {
        setError('No account found with this email/phone. Please sign up first.');
        return;
      }
      if (seller.password !== password) {
        setError('Incorrect password. Please try again.');
        return;
      }
      setSession(seller.id);
      onLogin(seller);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      {/* Main Authentication Card */}
      <main className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-8 shadow-sm">
        {/* Header / Logo Area */}
        <header className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">storefront</span>
          </div>
          <h1 className="text-headline-lg text-on-surface mb-1" style={{ fontWeight: 600 }}>MSME Seller Core</h1>
          <p className="text-body-md text-on-surface-variant" id="form-subtitle">
            {mode === 'login' ? 'Sign in to manage your business' : 'Join MSME Core to start selling'}
          </p>
        </header>

        {/* Authentication Form */}
        <form className="space-y-4 w-full" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {/* Identifier Input */}
          <div className="flex flex-col gap-1">
            <label className="text-label-md text-on-surface" htmlFor="identifier">
              Email or Phone Number
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">person</span>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9876543210 or name@store.com"
                className="w-full h-12 pl-12 pr-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-label-md text-on-surface" htmlFor="password">
                Password
              </label>
              {mode === 'login' && (
                <a href="#" className="text-label-sm text-primary hover:text-on-primary-fixed-variant transition-colors">
                  Forgot?
                </a>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">lock</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-12 pl-12 pr-12 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Privacy Helper Note */}
          <div className="flex items-start gap-2 bg-surface-container p-4 rounded-lg mt-2">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">shield_lock</span>
            <p className="text-label-sm text-on-surface-variant pt-[2px]">
              Your business data is stored securely and processed locally for faster, offline access.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2 flex flex-col">
            <button
              type="submit"
              className="w-full h-12 flex items-center justify-center bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-label-md rounded-lg transition-all active:scale-[0.98] shadow-sm"
            >
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-outline-variant"></div>
              <span className="flex-shrink-0 mx-4 text-label-sm text-on-surface-variant">or</span>
              <div className="flex-grow border-t border-outline-variant"></div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="w-full h-12 flex items-center justify-center bg-transparent border-2 border-primary text-primary hover:bg-surface-container-low text-label-md rounded-lg transition-all active:scale-[0.98]"
            >
              {mode === 'login' ? 'Create Account' : 'Back to Login'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
