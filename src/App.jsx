import { useEffect, useRef, useState } from 'react';
import { Settings, RefreshCw, Mail, Search, X } from 'lucide-react';
import { useQuickscrum } from './hooks/useQuickscrum';
import TicketCard from './components/TicketCard';
import './index.css';

function App() {
  const {
    items, loading, error, progress, refresh, loadPreviousMonth,
    searchQuery, setSearchQuery, filterProject, setFilterProject,
    filterType, setFilterType, availableProjects, clearFilters
  } = useQuickscrum();

  const [ticketTemplate, setTicketTemplate] = useState('https://www.quickscrum.com/GlobalSearch/GlobalSearch?EntityType=SUBITEM&SearchText=[ID]');
  const [storyTemplate, setStoryTemplate] = useState('https://www.quickscrum.com/GlobalSearch/GlobalSearch?SearchText=[ID]');

  const observerTarget = useRef(null);

  useEffect(() => {
    chrome.storage.sync.get(['ticketTemplate', 'storyTemplate'], (result) => {
      if (result.ticketTemplate) setTicketTemplate(result.ticketTemplate);
      if (result.storyTemplate) setStoryTemplate(result.storyTemplate);
    });
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          loadPreviousMonth();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [loading, loadPreviousMonth]);

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  };

  const handleItemClick = (item) => {
    let url = '';
    const encodedId = encodeURIComponent(item.id);
    if (item.type === 'ticket') {
      url = ticketTemplate.replace('[ID]', encodedId);
    } else {
      url = storyTemplate.replace('[ID]', encodedId);
    }
    chrome.tabs.create({ url });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header Sticky */}
      <div style={{ padding: '16px 16px 12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', zIndex: 10 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="var(--accent-blue)" /> QuickDock
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="notion-btn icon-btn" onClick={refresh} title="Refresh Current Month">
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            </button>
            <button className="notion-btn icon-btn" onClick={openOptions} title="Settings">
              <Settings size={16} />
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="notion-input pl-32"
              placeholder="Search tickets, stories, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="notion-select"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {availableProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              className="notion-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="ticket">Tickets</option>
              <option value="story">Stories</option>
            </select>

            {(filterProject || filterType || searchQuery) && (
              <button className="notion-btn small text-only" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} id="scroll-container">
        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(190, 82, 75, 0.1)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {items.map((item, idx) => (
          <TicketCard key={`${item.id}-${idx}`} item={item} onClick={handleItemClick} />
        ))}

        {/* Loading / Infinite Scroll Target */}
        <div ref={observerTarget} style={{ padding: '20px 0', textAlign: 'center' }}>
          {loading ? (
            <div className="skeleton-container">
              {progress ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>
                  Loading {progress.month}... {progress.total > 0 ? `(${progress.processed}/${progress.total})` : ''}
                </div>
              ) : null}
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
          ) : items.length === 0 && !error ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              No assignments found.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
