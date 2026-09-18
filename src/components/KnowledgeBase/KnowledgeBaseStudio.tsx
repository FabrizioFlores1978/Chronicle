import React, { useState } from 'react';
import { useEpub } from '../../context/EpubContext';
import { TimelineStudio } from '../Timeline/TimelineStudio';
import { CastPresenceGrid } from '../CastPresence/CastPresenceGrid';
import { Clock, LayoutGrid } from 'lucide-react';

export const KnowledgeBaseStudio: React.FC = () => {
  const { knowledgeBaseInitialTab } = useEpub();
  const [activeTab, setActiveTab] = useState<'timeline' | 'cast-grid'>(knowledgeBaseInitialTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.4rem 1rem',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="view-tabs" style={{ background: 'var(--bg-app)' }}>
          <button
            className={`view-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <Clock size={14} />
            <span>Timeline</span>
          </button>
          <button
            className={`view-tab-btn ${activeTab === 'cast-grid' ? 'active' : ''}`}
            onClick={() => setActiveTab('cast-grid')}
          >
            <LayoutGrid size={14} />
            <span>Cast Grid</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'timeline' && <TimelineStudio />}
        {activeTab === 'cast-grid' && <CastPresenceGrid />}
      </div>
    </div>
  );
};
