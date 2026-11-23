import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../App';
import { ArrowRight, Users, Video, MessageCircle } from 'lucide-react';

export default function Login({ onModeSelect }) {
  const socket = useSocket();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('video');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onError = (msg) => { setError(msg); setLoading(false); };
    socket.on('auth_error', onError);
    return () => socket.off('auth_error', onError);
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    onModeSelect(mode);
    socket.emit('direct_login', { email, password });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-8"
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md rounded-[2rem] bg-white/90 backdrop-blur-xl border border-border/70 shadow-lifted p-7 sm:p-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-accent text-white flex items-center justify-center font-display font-semibold text-lg shadow-soft">C</div>
          <div>
            <p className="font-display font-semibold text-base tracking-tight text-ink leading-none whitespace-nowrap">Campus Connect</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted mt-1">MSRUAS Network</p>
          </div>
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink mb-1">Welcome back.</h1>
        <p className="text-sm text-muted mb-6">Choose how you want to connect today.</p>

        <div className="flex p-1 bg-base rounded-full mb-6">
          <button type="button" onClick={() => setMode('video')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-full transition-all ${mode === 'video' ? 'bg-white shadow-soft text-ink' : 'text-muted hover:text-ink'}`}>
            <Video size={16} /> Video
          </button>
          <button type="button" onClick={() => setMode('text')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-full transition-all ${mode === 'text' ? 'bg-white shadow-soft text-ink' : 'text-muted hover:text-ink'}`}>
            <MessageCircle size={16} /> Text
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="25etcs002278@msruas.ac.in"
              autoComplete="username"
              className="w-full bg-base border border-transparent focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/10 rounded-2xl px-4 py-3.5 text-sm text-ink placeholder:text-muted/70 outline-none transition-all"
            />
          </div>
          <div>
            <input
              type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              autoComplete="current-password"
              className="w-full bg-base border border-transparent focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/10 rounded-2xl px-4 py-3.5 text-sm text-ink placeholder:text-muted/70 outline-none transition-all"
            />
          </div>

          {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5">{error}</div>}

          <button disabled={loading} type="submit" className="w-full mt-2 bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-medium text-sm py-3.5 rounded-full flex items-center justify-center gap-2 transition-all group shadow-soft hover:shadow-lifted">
            {loading ? 'Signing in…' : (<><Users size={15} className="opacity-80" /><span>Enter the lounge</span><ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" /></>)}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}