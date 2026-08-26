// Firebase authentication modal: Google + email/password login & registration
import { useEffect, useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  completeGoogleSignIn,
} from '../firebase/firebase';

export default function FirebaseAuthModal({ isOpen, onClose, onAuthChange }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    completeGoogleSignIn().then((res) => {
      if (cancelled || !res) return;
      if (res.user) {
        setSuccess('Accesso con Google completato!');
        onAuthChange?.(res.user);
        setTimeout(() => !cancelled && onClose(), 900);
      } else if (res.error) {
        setError('Accesso Google fallito: ' + res.error);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  const run = async (action, okMessage) => {
    setError('');
    setSuccess('');
    setLoading(true);
    const res = await action();
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.user) {
      setSuccess(okMessage);
      onAuthChange?.(res.user);
      setTimeout(onClose, 900);
    }
  };

  const googleLogin = async () =>
    run(async () => {
      const res = await loginWithGoogle();
      // With redirect flow the page reloads; a user-less non-error result just waits.
      return res.user ? res : { user: null, error: '' };
    }, 'Accesso con Google completato!');

  const emailLogin = (e) => {
    e.preventDefault();
    run(() => loginWithEmail(email, password), 'Accesso effettuato!');
  };

  const emailRegister = (e) => {
    e.preventDefault();
    run(() => registerWithEmail(email, password), 'Account creato con successo!');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--auth" onClick={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <h3>
            <ShieldCheck size={19} /> Connessione Firebase & Accesso
          </h3>
          <button onClick={onClose} className="modal__close" aria-label="Chiudi">
            <X size={18} />
          </button>
        </header>

        <div className="controls__tabs controls__tabs--inset">
          {['login', 'register'].map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`tab ${mode === m ? 'tab--active' : ''}`}>
              {m === 'login' ? 'Accedi' : 'Registrati'}
            </button>
          ))}
        </div>

        <div className="modal__state modal__state--auth">
          {error && (
            <p className="alert alert--error">
              <AlertCircle size={17} /> {error}
            </p>
          )}
          {success && (
            <p className="alert alert--success">
              <CheckCircle2 size={17} /> {success}
            </p>
          )}

          {loading && <Loader2 size={20} className="spin" style={{ alignSelf: 'center' }} />}

          {mode === 'login' ? (
            <>
              <button type="button" onClick={googleLogin} disabled={loading} className="btn btn--google btn--full">
                🌐 Accedi con Google
              </button>
              <div className="divider">oppure con email</div>
              <form onSubmit={emailLogin} className="stack">
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    required
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@squadra.com"
                  />
                </label>
                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    required
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </label>
                <button type="submit" disabled={loading} className="btn btn--primary btn--full">
                  Accedi con Email
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={emailRegister} className="stack">
              <label className="field">
                <span>Email di registrazione</span>
                <input
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@squadra.com"
                />
              </label>
              <label className="field">
                <span>Crea password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Almeno 6 caratteri"
                />
              </label>
              <button type="submit" disabled={loading} className="btn btn--primary btn--full">
                Crea account Firebase
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
