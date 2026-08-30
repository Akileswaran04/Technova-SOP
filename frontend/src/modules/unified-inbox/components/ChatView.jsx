/**
 * ChatView — right panel of the inbox.
 * WhatsApp-style chat: message bubbles (seller=right, customer=left),
 * order cards, timestamp dividers, text input with send button.
 */
import { useState, useRef, useEffect } from 'react';
import { getConversationById, sendMessage, markAsRead } from '../../../services/storage';
import { generateId } from '../../../hooks/useLocalStorage';

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
      <div className={`max-w-[75%] sm:max-w-[60%] ${isSeller ? 'order-1' : 'order-1'}`}>
        {/* Order card */}
        {message.order && <OrderCard order={message.order} />}

        {/* Text bubble */}
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

        {/* Time */}
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
  const [convo, setConvo] = useState(() => getConversationById(conversationId));

  useEffect(() => {
    // Mark messages as read
    if (convo && convo.unreadCount > 0) {
      markAsRead(conversationId);
    }
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationId, convo?.messages?.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const message = {
      id: generateId(),
      senderType: 'seller',
      text,
      timestamp: new Date().toISOString(),
    };

    const updated = sendMessage(conversationId, message);
    setConvo(updated);
    setInput('');
    onRefresh();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!convo) return null;

  const messages = convo.messages || [];

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex-shrink-0">
        {/* Back button (mobile only) */}
        <button
          onClick={onBack}
          className="lg:hidden p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        {/* Customer avatar */}
        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-sm font-bold flex-shrink-0">
          {convo.customerName?.charAt(0)?.toUpperCase() || '?'}
        </div>

        {/* Customer info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-label-md text-on-surface font-semibold truncate">{convo.customerName}</h3>
          <p className="text-label-sm text-on-surface-variant">
            {convo.orderTag ? `Order: ${convo.orderTag}` : 'Customer'}
          </p>
        </div>

        {/* More options */}
        <button className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>

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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-outline-variant bg-surface-container-lowest flex-shrink-0">
        {/* Quick actions */}
        <button className="p-2.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors flex-shrink-0"
          title="Quick reply templates">
          <span className="material-symbols-outlined text-[22px]">add_circle</span>
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors resize-none max-h-32"
            style={{ minHeight: '42px' }}
          />
        </div>

        {/* Send button */}
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
