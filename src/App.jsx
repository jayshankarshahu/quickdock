import { useEffect, useState } from 'react';
import { Settings, RefreshCw, Mail } from 'lucide-react';
import { useQuickscrum } from './hooks/useQuickscrum';
import TicketCard from './components/TicketCard';
import './index.css';

function App() {
  const { items, loading, error, refresh } = useQuickscrum();
  const [ticketTemplate, setTicketTemplate] = useState('https://www.quickscrum.com/GlobalSearch/GlobalSearch?EntityType=SUBITEM&SearchText=[ID]');
  const [storyTemplate, setStoryTemplate] = useState('https://www.quickscrum.com/GlobalSearch/GlobalSearch?SearchText=[ID]');

  useEffect(() => {
    chrome.storage.sync.get(['ticketTemplate', 'storyTemplate'], (result) => {
      if (result.ticketTemplate) setTicketTemplate(result.ticketTemplate);
      if (result.storyTemplate) setStoryTemplate(result.storyTemplate);
    });
  }, []);

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
    <div style={{ padding: '16px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={18} color="var(--accent-blue)" /> Quickscrum
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="notion-btn" onClick={refresh} title="Refresh Emails">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
          <button className="notion-btn" onClick={openOptions} title="Settings">
            <Settings size={16} />
          </button>
        </div>
      </header>

      {error && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(190, 82, 75, 0.1)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {loading && items.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px', fontSize: '14px' }}>
            <RefreshCw size={24} className="spinning" style={{ marginBottom: '12px' }} />
            <p>Fetching assignments from Gmail...</p>
          </div>
        ) : items.length === 0 && !error ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px', fontSize: '14px' }}>
            <p>No assignments found in recent emails.</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <TicketCard key={`${item.id}-${idx}`} item={item} onClick={handleItemClick} />
          ))
        )}
      </div>
    </div>
  );
}

export default App;
