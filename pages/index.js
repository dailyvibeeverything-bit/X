import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/studio');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reel Cover Studio — Login</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,800&family=Inter:wght@300;400;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; color: #f0ece4; font-family: 'Inter', sans-serif; }
        .page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #0a0a0a;
          background-image: linear-gradient(#1a1a1a 1px, transparent 1px),
            linear-gradient(90deg, #1a1a1a 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .card {
          background: #111; border: 1px solid #2a2a2a; border-radius: 16px;
          padding: 2.5rem 2rem; width: 100%; max-width: 380px;
          box-shadow: 0 32px 80px rgba(0,0,0,.8), 0 0 60px rgba(201,168,76,.05);
        }
        .logo { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 1.1rem; letter-spacing: 0.1em; color: #c9a84c; margin-bottom: 0.25rem; }
        .logo span { color: #f0ece4; }
        .sub { font-size: 0.72rem; color: #555; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 2rem; }
        label { display: block; font-size: 0.7rem; color: #777; margin-bottom: 0.4rem; letter-spacing: 0.06em; }
        input[type="password"] {
          width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a;
          border-radius: 8px; color: #f0ece4; font-family: 'Inter', sans-serif;
          font-size: 1rem; padding: 0.75rem 1rem; outline: none; transition: border-color .2s;
        }
        input[type="password"]:focus { border-color: #c9a84c; }
        .err { font-size: 0.72rem; color: #e86b6b; margin-top: 0.5rem; }
        .btn {
          width: 100%; margin-top: 1.25rem; padding: 0.85rem;
          background: #c9a84c; color: #000; border: none; border-radius: 8px;
          font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800;
          font-size: 0.9rem; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all .2s;
        }
        .btn:hover:not(:disabled) { background: #e8d5a3; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(201,168,76,.3); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="page">
        <div className="card">
          <div className="logo">REEL <span>COVER</span></div>
          <div className="sub">Studio — Enter to continue</div>
          <form onSubmit={login}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
            {error && <div className="err">{error}</div>}
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Checking…' : '→ Enter Studio'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
