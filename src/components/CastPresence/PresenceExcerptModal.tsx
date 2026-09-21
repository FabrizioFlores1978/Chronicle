import React from 'react';
import {
  EntityChapterPresence,
  CastPresenceEntity,
  CastPresenceChapterSummary,
} from '../../types/project';
import {
  X,
  BookOpen,
  Edit3,
  Users,
  Compass,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useEpub } from '../../context/EpubContext';

interface PresenceExcerptModalProps {
  presence: EntityChapterPresence | null;
  entity: CastPresenceEntity | null;
  chapter: CastPresenceChapterSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEntityDetail?: (id: string, type: 'character' | 'location') => void;
}

export const PresenceExcerptModal: React.FC<PresenceExcerptModalProps> = ({
  presence,
  entity,
  chapter,
  isOpen,
  onClose,
  onOpenEntityDetail,
}) => {
  const { setActiveChapterId, setViewMode } = useEpub();

  if (!isOpen || !presence || !entity || !chapter) return null;

  const isCharacter = entity.type === 'character';

  const handleOpenInEditor = () => {
    setActiveChapterId(chapter.id);
    setViewMode('editor');
    onClose();
  };

  const handleOpenInReader = () => {
    setActiveChapterId(chapter.id);
    setViewMode('reader');
    onClose();
  };

  const handleOpenEntityProfile = () => {
    if (onOpenEntityDetail) {
      onOpenEntityDetail(entity.id, entity.type);
    }
  };

  // Highlights the matched token inside a snippet
  const renderHighlightedSnippet = (snippet: string, matchedText: string) => {
    if (!matchedText) return snippet;

    // Split on matched text with case insensitivity
    const parts = snippet.split(new RegExp(`(${matchedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

    return (
      <span>
        {parts.map((part, index) => {
          const isMatch = part.toLowerCase() === matchedText.toLowerCase();
          return isMatch ? (
            <mark
              key={index}
              style={{
                backgroundColor: entity.color ? `${entity.color}35` : 'rgba(99, 102, 241, 0.3)',
                color: entity.color || 'var(--accent-primary)',
                fontWeight: 700,
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                border: `1px solid ${entity.color ? `${entity.color}70` : 'var(--accent-primary)'}`,
              }}
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </span>
    );
  };

  return (
    <div
      className="modal-overlay animate-fadeIn"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="modal-container-modern animate-scaleUp"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', minWidth: 0 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: entity.color || '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1.1rem',
                flexShrink: 0,
                boxShadow: `0 4px 12px ${entity.color}40`,
              }}
            >
              {isCharacter ? <Users size={20} /> : <Compass size={20} />}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {entity.name}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {entity.roleOrType}
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>in</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {chapter.title}
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn-icon btn-ghost btn-sm"
            onClick={onClose}
            title="Close Excerpt View (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Overview Badges */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
            <FileText size={15} color="var(--accent-primary)" />
            <span style={{ color: 'var(--text-secondary)' }}>Mention Frequency:</span>
            <span
              style={{
                fontWeight: 700,
                color: entity.color || 'var(--accent-primary)',
                backgroundColor: entity.color ? `${entity.color}20` : 'var(--bg-surface)',
                padding: '1px 8px',
                borderRadius: '8px',
              }}
            >
              {presence.count} {presence.count === 1 ? 'mention' : 'mentions'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {onOpenEntityDetail && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleOpenEntityProfile}
                style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ExternalLink size={13} />
                <span>Open {isCharacter ? 'Character Profile' : 'Codex Entry'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Content / Snippet List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          {presence.occurrences.length === 0 ? (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              No textual occurrences recorded for this entity in "{chapter.title}".
            </div>
          ) : (
            presence.occurrences.map((occ, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  position: 'relative',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Occurrence #{idx + 1}
                  </span>
                  <span>Offset char ~{occ.start.toLocaleString()}</span>
                </div>

                <div
                  style={{
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-reader-serif, Georgia, serif)',
                  }}
                >
                  {renderHighlightedSnippet(occ.snippet, occ.matchedText)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            Close
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleOpenInReader}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <BookOpen size={14} />
              <span>Read Chapter</span>
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleOpenInEditor}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Edit3 size={14} />
              <span>Edit Chapter in Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
