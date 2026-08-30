/**
 * ChatView — right panel of the inbox with NeuroChat AI auto-reply.
 * WhatsApp-style chat with AI draft generation, approval flow, and auto-reply toggle.
 * All data operations go through backend API.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { getConversationById, sendMessage, markAsRead } from '../../../services/storage';
import { analyzeMessage } from '../../ai-communication/services/aiEngine';
import AIDraft from '../../ai-communication/components/AIDraft';
import AutoReplyToggle from '../../ai-communication/components/AutoReplyToggle';

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDateDivider(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function shouldShowDateDivider(messages, index) {
  if (index === 0) return true;
  const curr = new Date(messages[index].timestamp).toDateString();
  const prev = new Date(messages[index - 1].timestamp).toDateString();
  return curr !== prev;
}

function OrderCard({ order }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-lg p-3 max-w-[280px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[18px] text-primary">receipt_long</span>
        <span className="text-label-md text-on-surface font-semibold">Order #{order.id?.slice(-6).toUpperCase()}</span>
      </div>
      {order.items?.map((item, i) => (
        <div key={i} className="flex justify-between text-label-sm text-on-surface-variant py-0.5">
          <span>{item.name} × {item.qty}</span>
          <span className="font-medium text-on-surface">₹{item.total?.toLocaleString('en-IN')}</span>
        </div>
      ))}
      {order.total && (
        <div className="flex justify-between text-label-md text-on-surface font-bold mt-2 pt-2 border-t border-outline-variant">
          <span>Total</span>
          <span>₹{order.total.toLocaleString('en-IN')}</span>
        </div>
      )}
      {order.status && (
        <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-label-sm font-medium ${
          order.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
          order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
          order.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
          'bg-surface-container text-on-surface-variant'
        }`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      )}
    </div>
  );
}

function MessageBubble({ message, isSeller }) {
  return (
    <div className={`flex ${isSeller ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[75%] sm:max-w-[60%]`}>
        {message.order && <OrderCard order={message.order} />}
        {message.text && (
          <div
            className={`px-3.5 py-2.5 text-body-md leading-relaxed ${
              isSeller
                ? 'bg-primary text-on-primary rounded-2xl rounded-br-md'
                : 'bg-surface-container-low text-on-surface rounded-2xl rounded-bl-md border border-outline-variant/50'
            }`}
          >
            {message.text}
          </div>
        )}
        {message.isAI && (
          <span className="inline-flex items-center gap-0.5 text-label-sm text-primary mt-0.5 ml-1">
            <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
            AI
          </span>
        )}
        <p className={`text-label-sm text-on-surface-variant mt-0.5 ${isSeller ? 'text-right' : 'text-left'}`}>
          {formatMessageTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function ChatView({ conversationId, sellerId, onBack, onRefresh, onToast }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [convo, setConvo] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI Auto-Reply state
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiMode, setAiMode] = useState('approval');
  const [aiDraft, setAiDraft] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load conversation
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getConversationById(conversationId);
        if (!cancelled) setConvo(data);
        // Mark as read
        if (data?.unreadCount > 0) {
          await markAsRead(conversationId);
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convo?.messages?.length]);

  // Auto-generate AI draft when a new customer message arrives
  useEffect(() => {
    if (!aiEnabled || !convo?.messages?.length) return;

    const lastMsg = convo.messages[convo.messages.length - 1];
    if (lastMsg.senderType === 'seller' || lastMsg.isAI) return;

    setIsAnalyzing(true);

    const timer = setTimeout(() => {
      const analysis = analyzeMessage(lastMsg.text);
      setAiDraft(analysis);
      setIsAnalyzing(false);

      if (aiMode === 'auto') {
        handleSendAIResponse(analysis.response);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [convo?.messages?.length, aiEnabled, aiMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendAIResponse = useCallback(async (text) => {
    if (!text) return;

    try {
      const result = await sendMessage(conversationId, {
        senderType: 'seller',
        text,
        isAI: true,
      });
      // Reload conversation
      const updated = await getConversationById(conversationId);
      setConvo(updated);
      setAiDraft(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to send AI response:', err);
    }
  }, [conversationId, onRefresh]);

  const handleAcceptDraft = useCallback((text) => {
    handleSendAIResponse(text);
    onToast?.('AI response sent');
  }, [handleSendAIResponse, onToast]);

  const handleEditDraft = useCallback((editedText) => {
    handleSendAIResponse(editedText);
    onToast?.('Edited response sent');
  }, [handleSendAIResponse, onToast]);

  const handleRewriteDraft = useCallback(() => {
    if (!aiDraft) return;
    setIsAnalyzing(true);
    setAiDraft(null);

    setTimeout(() => {
      const lastMsg = convo.messages[convo.messages.length - 1];
      const analysis = analyzeMessage(lastMsg.text);
      setAiDraft(analysis);
      setIsAnalyzing(false);
    }, 600);
  }, [aiDraft, convo]);

  const handleDismissDraft = useCallback(() => {
    setAiDraft(null);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    try {
      await sendMessage(conversationId, { senderType: 'seller', text });
      const updated = await getConversationById(conversationId);
      setConvo(updated);
      setInput('');
      setAiDraft(null);
      onRefresh();
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant animate-pulse">sync</span>
      </div>
    );
  }

  if (!convo) return null;

  const messages = convo.messages || [];

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex-shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-sm font-bold flex-shrink-0">
          {convo.customerName?.charAt(0)?.toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-label-md text-on-surface font-semibold truncate">{convo.customerName}</h3>
          <p className="text-label-sm text-on-surface-variant">
            {convo.orderTag ? `Order: ${convo.orderTag}` : 'Customer'}
          </p>
        </div>

        <button className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>

      {/* AI Auto-Reply Toggle */}
      <AutoReplyToggle
        enabled={aiEnabled}
        onToggle={setAiEnabled}
        mode={aiMode}
        onModeChange={setAiMode}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-background/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] opacity-30">chat_bubble_outline</span>
            <p className="text-body-md mt-2">Start a conversation</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, i) => (
              <div key={msg.id || i}>
                {shouldShowDateDivider(messages, i) && (
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 bg-surface-container rounded-full text-label-sm text-on-surface-variant">
                      {formatDateDivider(msg.timestamp)}
                    </span>
                  </div>
                )}
                <MessageBubble message={msg} isSeller={msg.senderType === 'seller'} />
              </div>
            ))}

            {isAnalyzing && (
              <div className="flex items-center gap-2 px-4 py-2 text-label-sm text-primary">
                <span className="material-symbols-outlined text-[16px] animate-pulse">auto_awesome</span>
                <span>NeuroChat is analyzing sentiment...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* AI Draft Panel */}
      {aiDraft && aiMode === 'approval' && (
        <AIDraft
          draft={aiDraft}
          onAccept={handleAcceptDraft}
          onEdit={handleEditDraft}
          onRewrite={handleRewriteDraft}
          onDismiss={handleDismissDraft}
        />
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-outline-variant bg-surface-container-lowest flex-shrink-0">
        <button className="p-2.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors flex-shrink-0"
          title="Quick reply templates">
          <span className="material-symbols-outlined text-[22px]">add_circle</span>
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={aiEnabled ? "Type a message (AI will draft a reply)..." : "Type a message..."}
            rows={1}
            className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors resize-none max-h-32"
            style={{ minHeight: '42px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2.5 rounded-full bg-primary hover:bg-on-primary-fixed-variant disabled:bg-surface-container text-on-primary disabled:text-on-surface-variant transition-colors flex-shrink-0 active:scale-95"
        >
          <span className="material-symbols-outlined text-[22px]">send</span>
        </button>
      </div>
    </div>
  );
}
