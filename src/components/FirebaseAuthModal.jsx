import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Key, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { loginWithEmail, registerWithEmail, loginWithGoogle, completeGoogleSignIn, getStoredFirebaseConfig, saveStoredFirebaseConfig, initFirebase } from '../firebase/firebase';

export default function FirebaseAuthModal({ isOpen, onClose, user, onAuthChange }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pick up a pending Google redirect sign-in (e.g. a return from Google with the modal open).
    let cancelled = false;
    completeGoogleSignIn()
      .then((res) => {
        if (cancelled) return;
        if (res.user) {
          setSuccessMsg('Signed in successfully with Google!');
          if (onAuthChange) onAuthChange(res.user);
          setTimeout(() => onClose(), 1000);
        } else if (res.error) {
          setErrorMsg('Google Sign-In failed: ' + res.error);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const res = await loginWithGoogle();
    setLoading(false);

    if (res.error) {
      setErrorMsg('Google Sign-In failed: ' + res.error);
    } else if (res.user) {
      setSuccessMsg('Signed in successfully with Google!');
      if (onAuthChange) onAuthChange(res.user);
      setTimeout(() => onClose(), 1000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const res = await loginWithEmail(email, password);
    setLoading(false);

    if (res.error) {
      setErrorMsg('Email sign-in error: ' + res.error);
    } else {
      setSuccessMsg('Signed in successfully!');
      if (onAuthChange) onAuthChange(res.user);
      setTimeout(() => onClose(), 1000);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const res = await registerWithEmail(email, password);
    setLoading(false);

    if (res.error) {
      setErrorMsg('Registration error: ' + res.error);
    } else {
      setSuccessMsg('Account created successfully!');
      if (onAuthChange) onAuthChange(res.user);
      setTimeout(() => onClose(), 1000);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <ShieldCheck size={22} className="text-cyan-400" />
            <h3>Firebase DB Connection & Sign In</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="controls-tabs" style={{ margin: '1rem 1.5rem 0' }}>
          <button
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`tab-btn ${mode === 'login' ? 'tab-active' : ''}`}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`tab-btn ${mode === 'register' ? 'tab-active' : ''}`}
          >
            <UserPlus size={15} />
            <span>Register</span>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {errorMsg && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-box alert-success">
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              {/* Google Auth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="btn-google-login"
              >
                <span>🌐 Sign In with Google Account</span>
              </button>

              <div className="divider-or">
                <span>or with Email</span>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="input-group">
                  <label className="input-label">User Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-text"
                    placeholder="name@team.com"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-text"
                    placeholder="••••••••"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Connecting...' : 'Sign In with Email'}
                </button>
              </form>
            </div>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="input-group">
                <label className="input-label">Registration Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-text"
                  placeholder="name@team.com"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Create Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-text"
                  placeholder="At least 6 characters"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Creating Account...' : 'Create Firebase Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
