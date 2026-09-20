import React, { useState } from 'react';
import {
  Camera,
  History,
  Clock,
  BookOpen,
  Users,
  MapPin,
  GitCommit,
  MessageSquare,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useEpub } from '../../context/EpubContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { StorySnapshot } from '../../types/epub';

export const SnapshotsModal: React.FC = () => {
  const {
    book,
    snapshots,
    isSnapshotsModalOpen,
    setIsSnapshotsModalOpen,
    createSnapshot,
    deleteSnapshot,
    restoreSnapshot,
  } = useEpub();

  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEscapeKey(() => {
    if (confirmRestoreId) {
      setConfirmRestoreId(null);
    } else if (confirmDeleteId) {
      setConfirmDeleteId(null);
    } else {
      setIsSnapshotsModalOpen(false);
    }
  }, isSnapshotsModalOpen);

  if (!isSnapshotsModalOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    setIsCreating(true);
    try {
      createSnapshot(snapshotName, snapshotDescription);
      setSnapshotName('');
      setSnapshotDescription('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmRestore = (id: string) => {
    restoreSnapshot(id);
    setConfirmRestoreId(null);
    setIsSnapshotsModalOpen(false);
  };

  const handleConfirmDelete = (id: string) => {
    deleteSnapshot(id);
    setConfirmDeleteId(null);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const ms = Date.now() - new Date(isoString).getTime();
      const sec = Math.floor(ms / 1000);
      if (sec < 60) return 'Just now';
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min}m ago`;
      const hrs = Math.floor(min / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 30) return `${days}d ago`;
      return formatDate(isoString);
    } catch {
      return '';
    }
  };

  const snapshotToRestore = snapshots.find(s => s.id === confirmRestoreId);
  const snapshotToDelete = snapshots.find(s => s.id === confirmDeleteId);

  return (
    <div className="modal-backdrop" onClick={() => setIsSnapshotsModalOpen(false)}>
      <div
        className="snapshots-modal-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="snapshots-modal-header">
          <div className="snapshots-header-title-row">
            <div className="snapshots-header-icon-badge">
              <Camera size={18} />
            </div>
            <div>
              <div className="snapshots-header-title-flex">
                <h3 className="snapshots-modal-title">Story Snapshots</h3>
                <span className="snapshots-count-pill">
                  {snapshots.length} {snapshots.length === 1 ? 'Snapshot' : 'Snapshots'}
                </span>
              </div>
              <p className="snapshots-modal-subtitle">
                Manuscript Time Machine • Preserve milestones, revisions, and story states
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon btn-sm"
            onClick={() => setIsSnapshotsModalOpen(false)}
            aria-label="Close snapshots modal"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="snapshots-modal-body">
          {/* Create Snapshot Card */}
          <form className="snapshots-create-card" onSubmit={handleCreate}>
            <div className="snapshots-create-card-header">
              <Sparkles size={15} style={{ color: 'var(--accent-primary)' }} />
              <span className="snapshots-create-card-title">Take New Story Snapshot</span>
            </div>

            <div className="snapshots-create-form-row">
              <div className="snapshots-form-group" style={{ flex: '1.2' }}>
                <label className="snapshots-form-label" htmlFor="snapshot-name-input">
                  Snapshot Name (Optional)
                </label>
                <input
                  id="snapshot-name-input"
                  type="text"
                  className="input-text snapshots-input"
                  placeholder="e.g., Draft 1 Complete / Pre-Act 2 Rewrite..."
                  value={snapshotName}
                  onChange={e => setSnapshotName(e.target.value)}
                />
              </div>

              <div className="snapshots-form-group" style={{ flex: '1.8' }}>
                <label className="snapshots-form-label" htmlFor="snapshot-desc-input">
                  Notes / Milestone Description (Optional)
                </label>
                <input
                  id="snapshot-desc-input"
                  type="text"
                  className="input-text snapshots-input"
                  placeholder="e.g., Finished climax scene before beta reader feedback"
                  value={snapshotDescription}
                  onChange={e => setSnapshotDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary snapshots-create-btn"
                disabled={isCreating || !book}
              >
                <Camera size={15} />
                <span>Capture Snapshot</span>
              </button>
            </div>

            <div className="snapshots-create-info-tip">
              <span className="snapshots-info-dot" />
              <span>
                Each snapshot saves all chapters, comments, timelines, characters, and locations. Saved separately in your <code>.chronicle</code> archive.
              </span>
            </div>
          </form>

          {/* Snapshots Timeline Section */}
          <div className="snapshots-timeline-section">
            <div className="snapshots-section-header">
              <History size={15} />
              <span>Timeline History ({snapshots.length})</span>
            </div>

            {snapshots.length === 0 ? (
              <div className="snapshots-empty-state">
                <div className="snapshots-empty-icon-box">
                  <Camera size={28} />
                </div>
                <h4 className="snapshots-empty-title">No Story Snapshots Yet</h4>
                <p className="snapshots-empty-text">
                  Take a snapshot anytime you reach a manuscript milestone, before major chapter rewrites, or to archive drafts you can return to later.
                </p>
              </div>
            ) : (
              <div className="snapshots-list">
                {snapshots.map((snapshot: StorySnapshot) => {
                  const isExpanded = expandedSnapshotId === snapshot.id;
                  const data = snapshot.data;
                  const chapters = data.chapters || [];
                  const charactersCount = data.characters?.length || 0;
                  const locationsCount = data.locations?.length || 0;
                  const timelinesCount = data.timelines?.length || 0;
                  const commentsCount = data.comments?.length || 0;

                  return (
                    <div key={snapshot.id} className="snapshot-card">
                      <div className="snapshot-card-main">
                        {/* Left Info Column */}
                        <div className="snapshot-card-info">
                          <div className="snapshot-card-title-row">
                            <h4 className="snapshot-card-name">{snapshot.name}</h4>
                            <span className="snapshot-relative-time" title={formatDate(snapshot.createdAt)}>
                              <Clock size={11} />
                              {getRelativeTime(snapshot.createdAt)}
                            </span>
                          </div>

                          <div className="snapshot-exact-date">
                            {formatDate(snapshot.createdAt)}
                          </div>

                          {snapshot.description && (
                            <p className="snapshot-card-description">{snapshot.description}</p>
                          )}

                          {/* Stats Badges */}
                          <div className="snapshot-metrics-row">
                            <span className="snapshot-metric-pill" title="Total Word Count">
                              <FileText size={12} />
                              {(snapshot.totalWordCount || 0).toLocaleString()} words
                            </span>
                            <span className="snapshot-metric-pill" title="Chapter Count">
                              <BookOpen size={12} />
                              {snapshot.chapterCount || chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
                            </span>
                            {charactersCount > 0 && (
                              <span className="snapshot-metric-pill" title="Character Profiles">
                                <Users size={12} />
                                {charactersCount} {charactersCount === 1 ? 'character' : 'characters'}
                              </span>
                            )}
                            {locationsCount > 0 && (
                              <span className="snapshot-metric-pill" title="Location Codex">
                                <MapPin size={12} />
                                {locationsCount} {locationsCount === 1 ? 'location' : 'locations'}
                              </span>
                            )}
                            {timelinesCount > 0 && (
                              <span className="snapshot-metric-pill" title="Timelines">
                                <GitCommit size={12} />
                                {timelinesCount} {timelinesCount === 1 ? 'timeline' : 'timelines'}
                              </span>
                            )}
                            {commentsCount > 0 && (
                              <span className="snapshot-metric-pill" title="Comments & Notes">
                                <MessageSquare size={12} />
                                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right Actions Column */}
                        <div className="snapshot-card-actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost snapshot-inspect-btn"
                            onClick={() => setExpandedSnapshotId(isExpanded ? null : snapshot.id)}
                            title={isExpanded ? 'Hide chapter breakdown' : 'Inspect snapshot contents'}
                          >
                            <span>Chapters</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline snapshot-restore-btn"
                            onClick={() => setConfirmRestoreId(snapshot.id)}
                            title="Restore active manuscript to this snapshot"
                          >
                            <RotateCcw size={13} />
                            <span>Restore</span>
                          </button>

                          <button
                            type="button"
                            className="btn-icon btn-sm btn-ghost snapshot-delete-btn"
                            onClick={() => setConfirmDeleteId(snapshot.id)}
                            title="Delete this snapshot"
                            aria-label="Delete snapshot"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Chapters Inspector */}
                      {isExpanded && (
                        <div className="snapshot-expanded-content">
                          <div className="snapshot-expanded-header">
                            <span>Chapter Breakdown at Snapshot</span>
                            <span className="snapshot-expanded-meta">{chapters.length} items</span>
                          </div>
                          <div className="snapshot-chapters-grid">
                            {chapters.map((ch, idx) => (
                              <div key={ch.id || idx} className="snapshot-chapter-chip">
                                <span className="snapshot-chapter-chip-order">{idx + 1}.</span>
                                <span className="snapshot-chapter-chip-title" title={ch.title}>
                                  {ch.title || 'Untitled Chapter'}
                                </span>
                                <span className="snapshot-chapter-chip-words">
                                  {(ch.wordCount || 0).toLocaleString()}w
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="snapshots-modal-footer">
          <div className="snapshots-footer-stats">
            <span>Total Captured Milestones: <strong>{snapshots.length}</strong></span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsSnapshotsModalOpen(false)}
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirmation Dialog: Restore Snapshot */}
      {confirmRestoreId && snapshotToRestore && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 1300, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setConfirmRestoreId(null)}
        >
          <div
            className="snapshot-confirm-dialog"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="snapshot-confirm-header">
              <div className="snapshot-confirm-icon-box restore">
                <RotateCcw size={20} />
              </div>
              <div>
                <h4 className="snapshot-confirm-title">Restore Manuscript Snapshot?</h4>
                <p className="snapshot-confirm-sub">
                  Target: <strong>"{snapshotToRestore.name}"</strong> ({formatDate(snapshotToRestore.createdAt)})
                </p>
              </div>
            </div>

            <div className="snapshot-confirm-body">
              <div className="snapshot-confirm-warning-box">
                <AlertTriangle size={16} />
                <span>
                  Restoring will revert your current workspace chapters, characters, locations, and timelines to this snapshot.
                </span>
              </div>
              <p className="snapshot-confirm-advice">
                Tip: If you want to keep your current progress, capture a new snapshot first before restoring!
              </p>
            </div>

            <div className="snapshot-confirm-footer">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmRestoreId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleConfirmRestore(snapshotToRestore.id)}
              >
                <RotateCcw size={14} />
                <span>Restore to This Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Snapshot */}
      {confirmDeleteId && snapshotToDelete && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 1300, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="snapshot-confirm-dialog"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="snapshot-confirm-header">
              <div className="snapshot-confirm-icon-box delete">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="snapshot-confirm-title">Delete Snapshot?</h4>
                <p className="snapshot-confirm-sub">
                  Are you sure you want to permanently delete <strong>"{snapshotToDelete.name}"</strong>?
                </p>
              </div>
            </div>

            <div className="snapshot-confirm-footer">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleConfirmDelete(snapshotToDelete.id)}
              >
                <Trash2 size={14} />
                <span>Delete Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
