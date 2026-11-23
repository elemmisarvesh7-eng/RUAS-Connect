import { useState, useEffect } from 'react';
import { useSocket } from '../App';
import { motion } from 'framer-motion';
import { LogOut, Users, Radio, Link2, Flag, Ban, Hash } from 'lucide-react';

export default function AdminDashboard() {
  const socket = useSocket();
  const [stats, setStats] = useState({
    onlineStudents: 0, totalRegistered: 0, activeCallsOrChats: 0, totalMatchesMade: 0,
    totalFlagged: 0, totalBanned: 0, usersList: [], reports: [], bannedList: [], branchBreakdown: {},
  });

  useEffect(() => {
    socket.on('admin_stats_update', (newStats) => setStats(newStats));
    return () => socket.off('admin_stats_update');
  }, []);

  const statCards = [
    { label: 'Online now',   value: stats.onlineStudents,   Icon: Users },
    { label: 'Registered',   value: stats.totalRegistered,  Icon: Hash },
    { label: 'Active chats', value: stats.activeCallsOrChats, Icon: Radio },
    { label: 'Total matches', value: stats.totalMatchesMade, Icon: Link2 },
    { label: 'Flagged',      value: stats.totalFlagged,     Icon: Flag,  danger: true },
    { label: 'Banned',       value: stats.totalBanned,      Icon: Ban,   danger: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[100dvh] w-full p-4 sm:p-8 lg:p-12 max-w-6xl mx-auto"
    >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-10">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-display font-semibold text-sm">A</div>
            <span className="font-display font-semibold tracking-tight text-ink">Cohort Admin</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink mt-2">Control room.</h1>
          <p className="text-sm text-muted mt-1">Monitor activity and moderate your network.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted hover:text-ink bg-white border border-border/70 px-4 py-2.5 rounded-full shadow-soft transition-colors"
        >
          <LogOut size={14} /> Exit
        </button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {statCards.map(({ label, value, Icon, danger }, i) => (
          <div key={i} className={`rounded-2xl border ${danger ? 'border-red-200 bg-red-50' : 'border-border/70 bg-white'} p-4 sm:p-5 shadow-soft`}>
            <div className={`flex items-center gap-2 mb-2 ${danger ? 'text-red-600' : 'text-muted'}`}>
              <Icon size={14} />
              <span className="text-[10px] uppercase tracking-[0.16em]">{label}</span>
            </div>
            <p className={`font-display text-3xl sm:text-4xl font-semibold tracking-tight ${danger ? 'text-red-700' : 'text-ink'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white border border-border/70 shadow-soft p-5 sm:p-6 mb-6">
        <h2 className="font-display font-semibold text-lg text-ink mb-3">Live branch activity</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(stats.branchBreakdown || {}).length === 0 && (
            <span className="text-xs text-muted italic">No one is online right now.</span>
          )}
          {Object.entries(stats.branchBreakdown || {}).map(([branch, count]) => (
            <span key={branch} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft text-accent text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              {branch} <span className="text-accent/70">· {count}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white border border-border/70 shadow-soft p-5 sm:p-6">
          <h2 className="font-display font-semibold text-lg text-ink mb-4">Active sessions</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {stats.usersList.length === 0 && <p className="text-sm text-muted italic">No active sessions.</p>}
            {stats.usersList.map((u) => (
              <div key={u.email} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 p-3 rounded-xl bg-base border border-border/60">
                <div className="min-w-0">
                  <p className="text-sm text-ink font-medium truncate">{u.email}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted mt-0.5">{u.batch} · {u.branch}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => socket.emit('admin_reset_user', u.email)} className="text-[10px] uppercase tracking-[0.14em] px-2.5 py-1.5 border border-border/70 text-muted hover:bg-ink hover:text-white hover:border-ink transition-colors rounded-full">Kick</button>
                  <button onClick={() => socket.emit('admin_ban_user', u.email)} className="text-[10px] uppercase tracking-[0.14em] px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors rounded-full">Ban</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-border/70 shadow-soft p-5 sm:p-6">
          <h2 className="font-display font-semibold text-lg text-ink mb-4">Flagged reports</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {stats.reports.length === 0 && <p className="text-sm text-muted italic">No flagged incidents.</p>}
            {stats.reports.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-red-50 border border-red-200">
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <p className="text-sm text-red-700 font-medium">{r.reason}</p>
                  <span className="text-[10px] text-muted shrink-0">{r.timestamp}</span>
                </div>
                <p className="text-[11px] text-muted mb-1.5 break-all">Target: {r.offenderEmail} · Reporter: {r.reporterEmail}</p>
                <p className="text-xs text-ink/70 italic border-l-2 border-red-300 pl-2.5 mb-2.5">&ldquo;{r.content}&rdquo;</p>
                <button onClick={() => socket.emit('admin_ban_user', r.offenderEmail)} className="text-[10px] uppercase tracking-[0.14em] px-2.5 py-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">Ban target</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.bannedList?.length > 0 && (
        <div className="rounded-3xl bg-white border border-border/70 shadow-soft p-5 sm:p-6 mt-6">
          <h2 className="font-display font-semibold text-lg text-ink mb-3">Banned IDs</h2>
          <div className="flex flex-wrap gap-2">
            {stats.bannedList.map((email) => (
              <span key={email} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs">
                {email}
                <button
                  onClick={() => socket.emit('admin_unban_user', email)}
                  className="text-[10px] uppercase tracking-[0.14em] text-red-600 hover:underline"
                >unban</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}