/**
 * BottomNav — mobile-first bottom tab navigation.
 * Now includes Inbox with unread badge.
 */
import { getNavTabs } from '../modules/MODULES';

const TABS = getNavTabs();

export default function BottomNav({ activeTab, onTabChange, unreadCount }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant z-50 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-20">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'inbox' && unreadCount > 0;
          return (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && onTabChange(tab.key)}
              disabled={tab.disabled}
              title={tab.comingSoon ? 'Coming soon' : undefined}
              className={`flex flex-col items-center justify-center w-16 h-16 group active:scale-95 transition-all duration-150 relative ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div
                className={`flex items-center justify-center rounded-full px-5 py-1 mb-1 transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-secondary-container group-hover:text-primary'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
                  {tab.icon}
                </span>
                {showBadge && (
                  <span className="absolute top-1 right-2 w-5 h-5 bg-error text-on-error rounded-full text-label-sm font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span
                className={`text-label-sm ${
                  isActive
                    ? 'text-on-surface font-semibold'
                    : 'text-on-secondary-container group-hover:text-primary'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopTabs({ activeTab, onTabChange, unreadCount }) {
  return (
    <div className="hidden lg:flex gap-1 mb-6 border-b border-outline-variant">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const showBadge = tab.key === 'inbox' && unreadCount > 0;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-label-md font-medium border-b-2 transition-all relative ${
              isActive
                ? 'border-primary text-primary font-bold bg-surface-container-low rounded-t-lg'
                : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-t-lg'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
            <span>{tab.label}</span>
            {showBadge && (
              <span className="w-5 h-5 bg-error text-on-error rounded-full text-label-sm font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
