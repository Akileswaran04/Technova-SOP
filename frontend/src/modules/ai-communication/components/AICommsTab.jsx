/**
 * AICommsTab — AI Communication Dashboard for sellers.
 * Integrates AutoReplyToggle, AIDraft, and aiEngine service.
 * Provides live message simulation, AI config, and performance stats.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeMessage } from '../services/aiEngine';
import AutoReplyToggle from './AutoReplyToggle';
import AIDraft from './AIDraft';

/* ── Mock buyer messages for simulation ────────────────── */

const mockBuyers = [
  { id: 'b1', name: 'GreenMart Retail', avatar: 'G', lastMessage: 'Hi! I\'m interested in bulk ordering your organic products. Can you share the wholesale price list?' },
  { id: 'b2', name: 'Apex Distributors', avatar: 'A', lastMessage: 'The last shipment arrived damaged. I need this resolved ASAP — this is unacceptable.' },
  { id: 'b3', name: 'Metro Wholesale', avatar: 'M', lastMessage: 'I\'m considering switching to your brand but I\'m not sure about the quality. Do you have samples?' },
  { id: 'b4', name: 'Nova Supplies', avatar: 'N', lastMessage: 'Wow, the new collection is amazing! I\'d love to feature it in our store. What\'s the best deal for 100 units?' },
  { id: 'b5', name: 'Urban Basket', avatar: 'U', lastMessage: 'Can you explain how your products compare to competitors? I\'m hesitant about making the switch.' },
];

const toneOptions = ['Professional', 'Friendly', 'Casual', 'Formal'];
const lengthOptions = ['Short', 'Medium', 'Detailed'];

/* ── Stats Card ────────────────────────────────────────── */

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-[22px] p-2 rounded-lg ${color}`}>{icon}</span>
        <div>
          <p className="text-headline-sm text-on-surface font-bold">{value}</p>
          <p className="text-label-sm text-on-surface-variant">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Live Message Item ─────────────────────────────────── */

function LiveMessage({ buyer, onGenerateDraft }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors border-b border-outline-variant/50 last:border-b-0">
      <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 text-label-md font-bold">
        {buyer.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-md text-on-surface font-medium truncate">{buyer.name}</p>
        <p className="text-label-sm text-on-surface-variant line-clamp-1 mt-0.5">{buyer.lastMessage}</p>
      </div>
      <button
        onClick={() => onGenerateDraft(buyer)}
        className="h-8 px-3 bg-primary/10 text-primary rounded-lg text-label-sm font-medium flex items-center gap-1.5 hover:bg-primary/20 transition-colors flex-shrink-0"
      >
        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
        Draft
      </button>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────── */

export default function AICommsTab({ sellerId, onToast }) {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoMode, setAutoMode] = useState('approval');
  const [drafts, setDrafts] = useState([]);
  const [stats, setStats] = useState({
    messagesProcessed: 247,
    responsesGenerated: 231,
    approvalRate: 89,
    avgResponseTime: '12s',
  });

  // AI settings
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Medium');
  const [showSettings, setShowSettings] = useState(false);

  // Pending messages (simulated inbox)
  const [pendingMessages, setPendingMessages] = useState(mockBuyers);

  const handleGenerateDraft = useCallback((buyer) => {
    const analysis = analyzeMessage(buyer.lastMessage);
    const draft = {
      id: `draft-${Date.now()}`,
      buyerId: buyer.id,
      buyerName: buyer.name,
      buyerMessage: buyer.lastMessage,
      ...analysis,
      timestamp: new Date().toISOString(),
    };

    setDrafts(prev => [draft, ...prev]);

    // Remove from pending if auto-reply is on
    if (autoReplyEnabled && autoMode === 'auto') {
      setPendingMessages(prev => prev.filter(m => m.id !== buyer.id));
      setStats(prev => ({
        ...prev,
        messagesProcessed: prev.messagesProcessed + 1,
        responsesGenerated: prev.responsesGenerated + 1,
      }));
      onToast(`AI auto-replied to ${buyer.name}`, 'success');
    }
  }, [autoReplyEnabled, autoMode, onToast]);

  const handleAcceptDraft = useCallback((draftId, response) => {
    const draft = drafts.find(d => d.id === draftId);
    setDrafts(prev => prev.filter(d => d.id !== draftId));
    setPendingMessages(prev => prev.filter(m => m.id !== draft?.buyerId));
    setStats(prev => ({
      ...prev,
      messagesProcessed: prev.messagesProcessed + 1,
      responsesGenerated: prev.responsesGenerated + 1,
      approvalRate: Math.min(prev.approvalRate + 1, 100),
    }));
    onToast(`Response sent to ${draft?.buyerName}`, 'success');
  }, [drafts, onToast]);

  const handleEditDraft = useCallback((draftId, editedText) => {
    setDrafts(prev => prev.map(d =>
      d.id === draftId ? { ...d, response: editedText } : d
    ));
    onToast('Draft updated', 'success');
  }, [onToast]);

  const handleRewriteDraft = useCallback((draftId) => {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;
    const newAnalysis = analyzeMessage(draft.buyerMessage);
    setDrafts(prev => prev.map(d =>
      d.id === draftId ? { ...d, response: newAnalysis.response } : d
    ));
    onToast('Draft rewritten', 'success');
  }, [drafts, onToast]);

  const handleDismissDraft = useCallback((draftId) => {
    setDrafts(prev => prev.filter(d => d.id !== draftId));
  }, []);

  // Auto-generate drafts when auto-reply is enabled
  useEffect(() => {
    if (!autoReplyEnabled || autoMode !== 'auto' || pendingMessages.length === 0) return;

    const timer = setTimeout(() => {
      const buyer = pendingMessages[0];
      handleGenerateDraft(buyer);
    }, 1500);

    return () => clearTimeout(timer);
  }, [autoReplyEnabled, autoMode, pendingMessages, handleGenerateDraft]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">smart_toy</span>
            NeuroChat AI
          </h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            AI-powered communication intelligence for your business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
            <span className={`w-2 h-2 rounded-full ${autoReplyEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {autoReplyEnabled ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="chat" label="Messages analyzed" value={stats.messagesProcessed.toLocaleString()} color="bg-blue-50 text-blue-600" />
        <StatCard icon="send" label="Responses sent" value={stats.responsesGenerated.toLocaleString()} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon="thumb_up" label="Approval rate" value={`${stats.approvalRate}%`} color="bg-purple-50 text-purple-600" />
        <StatCard icon="speed" label="Avg response time" value={stats.avgResponseTime} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Auto-Reply Toggle + Settings */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <AutoReplyToggle
          enabled={autoReplyEnabled}
          onToggle={setAutoReplyEnabled}
          mode={autoMode}
          onModeChange={setAutoMode}
        />

        {/* Settings toggle */}
        <div className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
          <span className="text-label-md text-on-surface font-medium">AI Configuration</span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className={`material-symbols-outlined text-[18px] transition-transform ${showSettings ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
        </div>

        {showSettings && (
          <div className="px-4 py-4 space-y-4 bg-surface-container-low">
            {/* Tone */}
            <div>
              <label className="text-label-md text-on-surface font-medium block mb-2">Response Tone</label>
              <div className="flex flex-wrap gap-2">
                {toneOptions.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`h-8 px-4 rounded-lg text-label-sm font-medium transition-colors ${
                      tone === t
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Length */}
            <div>
              <label className="text-label-md text-on-surface font-medium block mb-2">Response Length</label>
              <div className="flex gap-2">
                {lengthOptions.map(l => (
                  <button
                    key={l}
                    onClick={() => setLength(l)}
                    className={`h-8 px-4 rounded-lg text-label-sm font-medium transition-colors ${
                      length === l
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Product context */}
            <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">inventory_2</span>
                <span className="text-label-md text-on-surface">Auto-include product context</span>
              </div>
              <button
                className="relative w-10 h-5 rounded-full bg-primary transition-colors"
              >
                <span className="absolute top-0.5 left-5 w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Drafts */}
      {drafts.length > 0 && (
        <div>
          <h2 className="text-title-sm text-on-surface font-semibold mb-2 px-1">AI Drafts ({drafts.length})</h2>
          <div className="space-y-2">
            {drafts.map(draft => (
              <AIDraft
                key={draft.id}
                draft={draft}
                onAccept={(response) => handleAcceptDraft(draft.id, response)}
                onEdit={(editedText) => handleEditDraft(draft.id, editedText)}
                onRewrite={() => handleRewriteDraft(draft.id)}
                onDismiss={() => handleDismissDraft(draft.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Messages */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="text-title-sm text-on-surface font-semibold">Incoming Messages</h3>
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              {pendingMessages.length} message{pendingMessages.length !== 1 ? 's' : ''} awaiting response
            </p>
          </div>
          {autoReplyEnabled && (
            <span className="flex items-center gap-1.5 text-label-sm text-emerald-600 font-medium">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              AI {autoMode === 'auto' ? 'Auto' : 'Drafting'}
            </span>
          )}
        </div>

        {pendingMessages.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30">inbox</span>
            <p className="text-label-md text-on-surface-variant mt-2">All caught up! No pending messages.</p>
          </div>
        ) : (
          <div>
            {pendingMessages.map(buyer => (
              <LiveMessage
                key={buyer.id}
                buyer={buyer}
                onGenerateDraft={handleGenerateDraft}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
