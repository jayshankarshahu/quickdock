import { useEffect, useRef, useState } from 'react';
import { Settings, RefreshCw, Search, X } from 'lucide-react';
import { useQuickscrum } from './hooks/useQuickscrum';
import TicketCard from './components/TicketCard';
import './index.css';

function App() {
  const {
    items, loading, error, limitHit, emptyMessage,
    refresh, loadPreviousMonth,
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
        if (entries[0].isIntersecting && !loading && !limitHit) {
          loadPreviousMonth();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [loading, limitHit, loadPreviousMonth]);

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

  const renderItemsWithSeparators = () => {
    const elements = [];
    let currentMonthGroup = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const date = new Date(item.assignedDate);
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (monthName !== currentMonthGroup) {
        let gapText = '';
        if (currentMonthGroup !== null) {
          const prevDate = new Date(items[i - 1].assignedDate);
          const monthsDiff = (prevDate.getFullYear() - date.getFullYear()) * 12 + (prevDate.getMonth() - date.getMonth());

          if (monthsDiff > 1) {
            if (monthsDiff === 2) {
              const skippedDate = new Date(prevDate);
              skippedDate.setMonth(prevDate.getMonth() - 1);
              gapText = `(Skipped ${skippedDate.toLocaleString('default', { month: 'long', year: 'numeric' })})`;
            } else {
              gapText = `(${monthsDiff - 1} empty months skipped)`;
            }
          }
        }

        elements.push(
          <div key={`sep-${monthName}`} style={{
            margin: '24px 0 12px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {monthName} {gapText && <span style={{ fontWeight: 400, fontStyle: 'italic', textTransform: 'none' }}>{gapText}</span>}
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          </div>
        );
        currentMonthGroup = monthName;
      }

      elements.push(
        <TicketCard key={`${item.id}-${i}`} item={item} onClick={handleItemClick} />
      );
    }
    return elements;
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header Sticky */}
      <div style={{ padding: '16px 16px 12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', zIndex: 10 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            QuickDock
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

        {renderItemsWithSeparators()}

        {/* Loading / Infinite Scroll Target */}
        <div ref={observerTarget} style={{ padding: '20px 0', textAlign: 'center' }}>
          {loading ? (
            <div className="skeleton-container">
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
                Searching for older assignments...
              </div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
          ) : limitHit ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '10px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
              {emptyMessage}
              {items.length === 0 && <div style={{ marginTop: '8px' }}>No assignments found at all.</div>}
            </div>
          ) : items.length === 0 && !error ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '20px' }}>
              No assignments found yet. Scroll to search older months.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
