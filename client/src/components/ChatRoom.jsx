import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Flag, LogOut } from 'lucide-react';

const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function ChatRoom({ user, initialMode = 'video' }) {
  const socket = useSocket();
  const [mode, setMode] = useState(initialMode);
  const [chatState, setChatState] = useState('IDLE');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const chatBoxRef = useRef(null);
  const typingTimeout = useRef(null);

  const requestCamera = async () => {
    if (localStream.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return true;
    } catch (err) {
      console.error('Camera error:', err);
      return false;
    }
  };

  useEffect(() => {
    if (mode === 'video') {
      requestCamera().then(success => {
        if (!success) {
          appendSystemMessage('No camera found. Switched to Text Mode.');
          setMode('text');
        }
      });
    }
  }, []);

  useEffect(() => {
    socket.on('waiting', () => appendSystemMessage('Looking for a classmate…'));
    socket.on('match_found', async (data) => {
      setChatState('CHATTING');
      appendSystemMessage(`You're chatting with a ${data.batch} · ${data.branch} student.`);
      if (data.mode === 'video' && localStream.current) await setupPeerConnection(data.initiator);
    });
    socket.on('partner_disconnected', () => { closeWebRTC(); appendSystemMessage('Your partner left the chat.'); setChatState('IDLE'); });
    socket.on('receive_message', (text) => { setIsTyping(false); appendMessage(text, 'stranger'); });
    socket.on('partner_typing', (typing) => setIsTyping(typing));

    socket.on('webrtc_offer', async (offer) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('webrtc_answer', answer);
    });
    socket.on('webrtc_answer', async (answer) => { if (peerConnection.current) await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer)); });
    socket.on('webrtc_ice_candidate', async (candidate) => { if (peerConnection.current) await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)); });

    return () => { socket.off(); closeWebRTC(); if (localStream.current) localStream.current.getTracks().forEach(t => t.stop()); };
  }, []);

  const scrollToBottom = () => { setTimeout(() => { if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight; }, 50); };
  const appendMessage = (text, sender) => { setMessages(prev => [...prev, { text, sender, id: `${Date.now()}-${Math.random()}` }]); scrollToBottom(); };
  const appendSystemMessage = (text) => { setMessages(prev => [...prev, { text, sender: 'system', id: `${Date.now()}-${Math.random()}` }]); scrollToBottom(); };

  const startSearch = async () => {
    let finalMode = mode;
    if (mode === 'video' && !localStream.current) {
      const success = await requestCamera();
      if (!success) {
        appendSystemMessage('Camera denied. Switched to Text Mode.');
        finalMode = 'text';
        setMode('text');
      }
    }
    setMessages([]);
    setChatState('WAITING');
    socket.emit('find_partner', finalMode);
  };

  const setupPeerConnection = async (isInitiator) => {
    peerConnection.current = new RTCPeerConnection(rtcConfig);
    localStream.current.getTracks().forEach(track => peerConnection.current.addTrack(track, localStream.current));
    peerConnection.current.ontrack = (event) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]; };
    peerConnection.current.onicecandidate = (event) => { if (event.candidate) socket.emit('webrtc_ice_candidate', event.candidate); };
    if (isInitiator) {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit('webrtc_offer', offer);
    }
  };

  const closeWebRTC = () => {
    if (peerConnection.current) { peerConnection.current.close(); peerConnection.current = null; }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || chatState !== 'CHATTING') return;
    appendMessage(input, 'you');
    socket.emit('send_message', input);
    setInput('');
    socket.emit('typing', false);
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (chatState === 'CHATTING') {
      socket.emit('typing', true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => socket.emit('typing', false), 1200);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-base">
      <header className="p-3 sm:p-4 shrink-0">
        <div className="flex justify-between items-center rounded-full bg-white/80 backdrop-blur-md border border-border/70 shadow-soft px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-accent text-white flex items-center justify-center font-display font-semibold text-sm shrink-0">C</div>
            <span className="font-display font-semibold text-sm sm:text-base tracking-tight text-ink whitespace-nowrap">Campus Connect</span>
            <span className="hidden sm:flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted bg-base px-2.5 py-1 rounded-full border border-border/60 ml-1">
              {mode === 'video' ? 'Video Mode' : 'Text Only'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { socket.emit('report_partner', 'Reported'); closeWebRTC(); setChatState('IDLE'); }} className="p-2 rounded-full text-muted hover:text-red-600 hover:bg-red-50 transition-colors" title="Report"><Flag size={16} /></button>
            <button onClick={() => { localStorage.removeItem('campuslink_token'); window.location.reload(); }} className="p-2 rounded-full text-muted hover:text-ink hover:bg-base transition-colors" title="Logout"><LogOut size={16} /></button>
          </div>
        </div>
      </header>

      <main className={`flex-1 flex flex-col lg:flex-row gap-3 px-3 pb-3 sm:px-4 sm:pb-4 min-h-0 ${mode === 'text' ? 'justify-center' : ''}`}>
        
        {mode === 'video' && (
          <section className="flex-1 relative rounded-3xl overflow-hidden bg-ink shadow-lifted min-h-0">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-24 h-32 sm:w-32 sm:h-44 lg:w-40 lg:h-56 bg-black rounded-2xl border-2 border-white/30 overflow-hidden shadow-lifted z-20">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] uppercase tracking-[0.15em] text-white">You</div>
            </div>
            {chatState !== 'CHATTING' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/80 backdrop-blur-md z-10">
                {chatState === 'WAITING' ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-[10px] sm:text-xs tracking-[0.22em] uppercase text-white/70">Finding someone</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <p className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">Ready when you are.</p>
                    <p className="text-xs sm:text-sm text-white/60 max-w-xs">Meet a random classmate from the 25-batch. Cameras optional.</p>
                    <button onClick={startSearch} className="mt-3 bg-white text-ink px-7 py-3 rounded-full font-medium text-sm hover:bg-accent hover:text-white transition-all shadow-lifted">Start connecting</button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <section className={`flex flex-col bg-white rounded-3xl shadow-soft border border-border/60 overflow-hidden shrink-0 transition-all ${mode === 'text' ? 'w-full max-w-2xl h-[85vh] mx-auto' : 'w-full lg:w-[380px] h-[42vh] lg:h-auto'}`}>
          <div className="px-5 py-4 border-b border-border/60 shrink-0 flex justify-between items-center">
            <div>
              <h2 className="font-display font-semibold text-base text-ink tracking-tight">Messages</h2>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted mt-0.5">{chatState === 'CHATTING' ? 'Connected' : chatState === 'WAITING' ? 'Searching…' : 'Not connected'}</p>
            </div>
            {mode === 'text' && chatState === 'IDLE' && (
              <button onClick={startSearch} className="bg-accent text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-accent/90 transition-all">Find someone</button>
            )}
          </div>

          <div ref={chatBoxRef} className="flex-1 px-4 sm:px-5 py-4 overflow-y-auto space-y-2.5">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col animate-fade-up ${m.sender === 'you' ? 'items-end' : m.sender === 'system' ? 'items-center' : 'items-start'}`}>
                  {m.sender === 'system' ? (
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted bg-base border border-border/60 px-3 py-1 rounded-full text-center max-w-[90%]">{m.text}</span>
                  ) : (
                    <><span className="text-[10px] text-muted mb-1 px-1">{m.sender === 'you' ? 'You' : 'Stranger'}</span>
                    <div className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${m.sender === 'you' ? 'bg-accent text-white rounded-2xl rounded-tr-md' : 'bg-base border border-border/70 text-ink rounded-2xl rounded-tl-md'}`}>{m.text}</div></>
                  )}
                </div>
              ))}
            </AnimatePresence>
            {isTyping && <div className="text-[10px] uppercase tracking-[0.16em] text-accent animate-pulse pl-1">They're typing…</div>}
          </div>

          <div className="p-3 border-t border-border/60 bg-base/60 shrink-0">
            <form onSubmit={sendMessage} className="relative flex items-center">
              <input type="text" value={input} onChange={handleTyping} disabled={chatState !== 'CHATTING'} placeholder={chatState === 'CHATTING' ? 'Type a message…' : 'Waiting for connection…'} className="w-full bg-white border border-border rounded-full py-2.5 pl-4 pr-12 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:opacity-60 transition-all" />
              <button disabled={chatState !== 'CHATTING'} type="submit" className="absolute right-1 p-2 bg-accent text-white rounded-full hover:bg-accent/90 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100"><Send size={14} /></button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}