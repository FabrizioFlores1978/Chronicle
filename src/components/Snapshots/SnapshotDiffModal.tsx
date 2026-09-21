import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  FileText,
  Clock,
  Filter,
  Undo2,
  CheckCheck,
  Plus,
} from 'lucide-react';
import { useEpub } from '../../context/EpubContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { StorySnapshot } from '../../types/project';
import {
  computeChapterDiffSummary,
  applyDiffRowToCurrentHtml,
  DiffRow,
  ChapterDiffSummary,
  WordDiffChunk,
} from '../../services/diff/snapshotDiffService';

interface SnapshotDiffModalProps {
  snapshot: StorySnapshot;
  onClose: () => void;
  initialChapterId?: string;
}

interface UndoEntry {
  chapterId: string;
  previousHtml: string;
  label: string;
}

export const SnapshotDiffModal: React.FC<SnapshotDiffModalProps> = ({
  snapshot,
  onClose,
  initialChapterId,
}) => {
  const { book, updateChapterContent, restoreSnapshot, showNotification } = useEpub();

  // Combine and order all chapters from current book and snapshot
  const currentChapters = book?.chapters || [];
  const snapshotChapters = snapshot.data.chapters || [];

  const allChapterIds = useMemo(() => {
    const ids: string[] = [];
    currentChapters.forEach(c => {
      if (!ids.includes(c.id)) ids.push(c.id);
    });
    snapshotChapters.forEach(c => {
      if (!ids.includes(c.id)) ids.push(c.id);
    });
    return ids;
  }, [currentChapters, snapshotChapters]);

  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    if (initialChapterId && allChapterIds.includes(initialChapterId)) {
      return initialChapterId;
    }
    // Find first modified chapter, otherwise first chapter
    for (const id of allChapterIds) {
      const cur = currentChapters.find(c => c.id === id);
      const snap = snapshotChapters.find(c => c.id === id);
      if (cur?.content !== snap?.content) {
        return id;
      }
    }
    return allChapterIds[0] || '';
  });

  const [filterOnlyDiffs, setFilterOnlyDiffs] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);

  useEscapeKey(onClose);

  // Active chapters for selected ID
  const activeCurrentChapter = currentChapters.find(c => c.id === selectedChapterId);
  const activeSnapshotChapter = snapshotChapters.find(c => c.id === selectedChapterId);

  const chapterTitle =
    activeCurrentChapter?.title ||
    activeSnapshotChapter?.title ||
    'Untitled Chapter';

  // Compute diff for currently selected chapter
  const currentSummary: ChapterDiffSummary = useMemo(() => {
    return computeChapterDiffSummary(
      selectedChapterId,
      chapterTitle,
      activeCurrentChapter?.content,
      activeSnapshotChapter?.content
    );
  }, [selectedChapterId, chapterTitle, activeCurrentChapter?.content, activeSnapshotChapter?.content]);

  // Compute status for all chapters for navigation bar pills
  const chapterSummariesMap = useMemo(() => {
    const map = new Map<string, { status: string; totalChanges: number }>();
    allChapterIds.forEach(id => {
      const cur = currentChapters.find(c => c.id === id);
      const snap = snapshotChapters.find(c => c.id === id);
      const sum = computeChapterDiffSummary(id, cur?.title || snap?.title || '', cur?.content, snap?.content);
      map.set(id, {
        status: sum.status,
        totalChanges: sum.modifiedCount + sum.addedCount + sum.removedCount,
      });
    });
    return map;
  }, [allChapterIds, currentChapters, snapshotChapters]);

  // Total changes across whole manuscript
  const totalManuscriptChanges = useMemo(() => {
    let count = 0;
    chapterSummariesMap.forEach(val => {
      count += val.totalChanges;
    });
    return count;
  }, [chapterSummariesMap]);

  // Navigation handlers
  const currentIndex = allChapterIds.indexOf(selectedChapterId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allChapterIds.length - 1;

  const handlePrevChapter = () => {
    if (hasPrev) setSelectedChapterId(allChapterIds[currentIndex - 1]);
  };

  const handleNextChapter = () => {
    if (hasNext) setSelectedChapterId(allChapterIds[currentIndex + 1]);
  };

  // 1-Click Move single row
  const handleMoveDiffRow = (row: DiffRow) => {
    if (!activeCurrentChapter) {
      showNotification('error', 'Chapter does not exist in current manuscript');
      return;
    }

    const previousHtml = activeCurrentChapter.content;
    const updatedHtml = applyDiffRowToCurrentHtml(
      previousHtml,
      currentSummary.diffRows,
      row.id
    );

    if (updatedHtml === previousHtml) return;

    // Push to undo stack
    setUndoStack(prev => [
      {
        chapterId: selectedChapterId,
        previousHtml,
        label: `Move ${row.type} paragraph`,
      },
      ...prev.slice(0, 19),
    ]);

    updateChapterContent(selectedChapterId, updatedHtml);
    showNotification('success', `Moved change from snapshot to current chapter`);
  };

  // 1-Click Apply all changes in this chapter
  const handleApplyAllChapterChanges = () => {
    if (!activeCurrentChapter || !activeSnapshotChapter) return;

    const previousHtml = activeCurrentChapter.content;
    const newHtml = activeSnapshotChapter.content;

    setUndoStack(prev => [
      {
        chapterId: selectedChapterId,
        previousHtml,
        label: `Apply all changes in "${chapterTitle}"`,
      },
      ...prev.slice(0, 19),
    ]);

    updateChapterContent(selectedChapterId, newHtml);
    showNotification('success', `Applied all snapshot changes to "${chapterTitle}"`);
  };

  const handleRestoreDeletedChapter = () => {
    if (!activeSnapshotChapter) return;
    restoreSnapshot(snapshot.id, {
      chapters: true,
      selectedChapterIds: [selectedChapterId],
    });
    showNotification('success', `Restored chapter "${chapterTitle}" to current manuscript`);
  };

  // Undo last action
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [lastAction, ...rest] = undoStack;
    updateChapterContent(lastAction.chapterId, lastAction.previousHtml);
    setUndoStack(rest);
    showNotification('info', `Undid: ${lastAction.label}`);
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

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 1400, backgroundColor: 'rgba(0, 0, 0, 0.82)' }}
      onClick={onClose}
    >
      <div
        className="snapshot-diff-modal-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Main Header */}
        <div className="snapshot-diff-modal-header">
          <div className="snapshot-diff-header-left">
            <div className="snapshot-diff-header-badge">
              <GitCompare size={20} />
            </div>
            <div>
              <div className="snapshot-diff-title-row">
                <h3 className="snapshot-diff-modal-title">Time Machine Chapter Diff & Merge</h3>
                <span className="snapshot-diff-pill">
                  Comparing with: <strong>"{snapshot.name}"</strong> ({totalManuscriptChanges} changes across manuscript)
                </span>
                <span className="snapshot-diff-date">
                  <Clock size={12} />
                  {formatDate(snapshot.createdAt)}
                </span>
              </div>
              <p className="snapshot-diff-subtitle">
                Side-by-side manuscript comparison • Review and merge paragraphs from this snapshot into your current draft
              </p>
            </div>
          </div>

          <div className="snapshot-diff-header-actions">
            {undoStack.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-ghost snapshot-diff-undo-btn"
                onClick={handleUndo}
                title={`Undo last move: ${undoStack[0].label}`}
              >
                <Undo2 size={14} />
                <span>Undo Move ({undoStack.length})</span>
              </button>
            )}

            <button
              type="button"
              className="btn-icon btn-sm"
              onClick={onClose}
              aria-label="Close diff viewer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chapter Selection Strip */}
        <div className="snapshot-diff-nav-bar">
          <div className="snapshot-diff-nav-controls">
            <button
              type="button"
              className="btn-icon btn-sm snapshot-diff-nav-arrow"
              onClick={handlePrevChapter}
              disabled={!hasPrev}
              title="Previous chapter"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="snapshot-diff-nav-counter">
              Chapter {currentIndex + 1} of {allChapterIds.length}
            </span>
            <button
              type="button"
              className="btn-icon btn-sm snapshot-diff-nav-arrow"
              onClick={handleNextChapter}
              disabled={!hasNext}
              title="Next chapter"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Chapter Tabs Scrollable Row */}
          <div className="snapshot-diff-tabs-scroll">
            {allChapterIds.map((id, idx) => {
              const cur = currentChapters.find(c => c.id === id);
              const snap = snapshotChapters.find(c => c.id === id);
              const title = cur?.title || snap?.title || `Chapter ${idx + 1}`;
              const isSelected = id === selectedChapterId;
              const meta = chapterSummariesMap.get(id);
              const status = meta?.status || 'identical';
              const changeCount = meta?.totalChanges || 0;

              return (
                <button
                  key={id}
                  type="button"
                  className={`snapshot-diff-tab ${isSelected ? 'active' : ''} ${status}`}
                  onClick={() => setSelectedChapterId(id)}
                >
                  <span className="snapshot-diff-tab-order">{idx + 1}.</span>
                  <span className="snapshot-diff-tab-title" title={title}>
                    {title}
                  </span>
                  {status === 'identical' ? (
                    <span className="snapshot-diff-tab-badge identical" title="Identical in both versions">
                      <Check size={10} />
                    </span>
                  ) : status === 'added_in_snapshot' ? (
                    <span className="snapshot-diff-tab-badge added" title="Only in Snapshot">
                      +Snapshot
                    </span>
                  ) : status === 'deleted_in_snapshot' ? (
                    <span className="snapshot-diff-tab-badge removed" title="Only in Current">
                      +Current
                    </span>
                  ) : (
                    <span className="snapshot-diff-tab-badge modified" title={`${changeCount} paragraph changes`}>
                      {changeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter & Batch Actions */}
          <div className="snapshot-diff-toolbar-actions">
            <button
              type="button"
              className={`snapshot-diff-filter-btn ${filterOnlyDiffs ? 'active' : ''}`}
              onClick={() => setFilterOnlyDiffs(!filterOnlyDiffs)}
              title={filterOnlyDiffs ? 'Show all paragraphs including unchanged' : 'Show only changed paragraphs'}
            >
              <Filter size={13} />
              <span>{filterOnlyDiffs ? 'Showing Changes Only' : 'Show Only Changes'}</span>
            </button>

            {currentSummary.status === 'modified' && (
              <button
                type="button"
                className="btn btn-sm btn-primary snapshot-diff-apply-all-btn"
                onClick={handleApplyAllChapterChanges}
                title="Replace current chapter with entire snapshot version"
              >
                <ArrowLeft size={14} />
                <span>Apply All Snapshot Changes</span>
              </button>
            )}

            {currentSummary.status === 'added_in_snapshot' && (
              <button
                type="button"
                className="btn btn-sm btn-primary snapshot-diff-apply-all-btn"
                onClick={handleRestoreDeletedChapter}
                title="Restore this entire chapter from snapshot into current manuscript"
              >
                <Plus size={14} />
                <span>Restore Chapter to Current</span>
              </button>
            )}
          </div>
        </div>

        {/* Comparison Header Bar (Left = Current, Right = Snapshot) */}
        <div className="snapshot-diff-pane-headers">
          <div className="snapshot-diff-pane-header left">
            <div className="snapshot-diff-pane-header-info">
              <span className="snapshot-diff-pane-tag current">Current Version</span>
              <h4 className="snapshot-diff-pane-title">
                {activeCurrentChapter?.title || 'Chapter Not in Current Manuscript'}
              </h4>
            </div>
            <div className="snapshot-diff-pane-metrics">
              <span className="snapshot-diff-metric-pill">
                <FileText size={12} />
                {(currentSummary.currentWordCount || 0).toLocaleString()} words
              </span>
            </div>
          </div>

          <div className="snapshot-diff-pane-header-divider">
            <span>Move</span>
          </div>

          <div className="snapshot-diff-pane-header right">
            <div className="snapshot-diff-pane-header-info">
              <span className="snapshot-diff-pane-tag snapshot">
                Snapshot: "{snapshot.name}"
              </span>
              <h4 className="snapshot-diff-pane-title">
                {activeSnapshotChapter?.title || 'Chapter Not in Snapshot'}
              </h4>
            </div>
            <div className="snapshot-diff-pane-metrics">
              <span className="snapshot-diff-metric-pill">
                <FileText size={12} />
                {(currentSummary.snapshotWordCount || 0).toLocaleString()} words
              </span>
              {currentSummary.wordCountDelta !== 0 && (
                <span
                  className={`snapshot-diff-delta-pill ${currentSummary.wordCountDelta > 0 ? 'positive' : 'negative'
                    }`}
                  title="Word count difference from current to snapshot"
                >
                  {currentSummary.wordCountDelta > 0
                    ? `+${currentSummary.wordCountDelta}`
                    : currentSummary.wordCountDelta}w
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Side-by-Side Diff Content Area */}
        <div className="snapshot-diff-scrollable-body">
          {currentSummary.status === 'identical' ? (
            <div className="snapshot-diff-identical-state">
              <div className="snapshot-diff-identical-icon-box">
                <CheckCheck size={28} />
              </div>
              <h4>Both Versions are Identical</h4>
              <p>
                There are no text differences in <strong>"{chapterTitle}"</strong> between your active working manuscript and snapshot "{snapshot.name}".
              </p>
            </div>
          ) : currentSummary.diffRows.length === 0 ? (
            <div className="snapshot-diff-identical-state">
              <p>No content available to compare in this chapter.</p>
            </div>
          ) : (
            <div className="snapshot-diff-rows-container">
              {currentSummary.diffRows.map(row => {
                if (filterOnlyDiffs && row.type === 'equal') return null;

                const isModified = row.type === 'modified';
                const isAddedInSnapshot = row.type === 'added';
                const isRemovedInSnapshot = row.type === 'removed';

                return (
                  <div key={row.id} className={`snapshot-diff-row ${row.type}`}>
                    {/* LEFT PANE: Current Working Version */}
                    <div className="snapshot-diff-cell left">
                      <div className="snapshot-diff-line-number">
                        {row.leftIndex ? `P${row.leftIndex}` : '—'}
                      </div>
                      <div className="snapshot-diff-cell-content">
                        {row.leftBlock ? (
                          <div className="snapshot-diff-text">
                            {row.leftBlock.text}
                          </div>
                        ) : (
                          <div className="snapshot-diff-empty-placeholder">
                            <span>(Paragraph absent in current version)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CENTER ACTION GUTTER: 1-Click Move Button */}
                    <div className="snapshot-diff-gutter-cell">
                      {isModified && (
                        <button
                          type="button"
                          className="snapshot-diff-gutter-btn modify"
                          onClick={() => handleMoveDiffRow(row)}
                          title="Move snapshot paragraph into current working copy"
                        >
                          <ArrowLeft size={13} />
                          <span>Move</span>
                        </button>
                      )}

                      {isAddedInSnapshot && (
                        <button
                          type="button"
                          className="snapshot-diff-gutter-btn insert"
                          onClick={() => handleMoveDiffRow(row)}
                          title="Insert this snapshot paragraph into current draft"
                        >
                          <ArrowLeft size={13} />
                          <span>Insert</span>
                        </button>
                      )}

                      {isRemovedInSnapshot && (
                        <button
                          type="button"
                          className="snapshot-diff-gutter-btn revert"
                          onClick={() => handleMoveDiffRow(row)}
                          title="Delete paragraph from current to match snapshot"
                        >
                          <ArrowLeft size={13} />
                          <span>Delete</span>
                        </button>
                      )}

                      {row.type === 'equal' && (
                        <div className="snapshot-diff-gutter-equal" title="Identical paragraph">
                          <span />
                        </div>
                      )}
                    </div>

                    {/* RIGHT PANE: Snapshot Version with Color Coding */}
                    <div className="snapshot-diff-cell right">
                      <div className="snapshot-diff-line-number">
                        {row.rightIndex ? `P${row.rightIndex}` : '—'}
                      </div>
                      <div className="snapshot-diff-cell-content">
                        {row.rightBlock ? (
                          <div className="snapshot-diff-text">
                            {isModified && row.wordDiff ? (
                              // Word-level diff display
                              row.wordDiff.map((chunk: WordDiffChunk, cIdx: number) => {
                                if (chunk.type === 'added') {
                                  return (
                                    <span key={cIdx} className="diff-word-added">
                                      {chunk.text}
                                    </span>
                                  );
                                }
                                if (chunk.type === 'removed') {
                                  return (
                                    <span key={cIdx} className="diff-word-removed">
                                      {chunk.text}
                                    </span>
                                  );
                                }
                                return <span key={cIdx}>{chunk.text}</span>;
                              })
                            ) : (
                              row.rightBlock.text
                            )}
                          </div>
                        ) : (
                          <div className="snapshot-diff-empty-placeholder">
                            <span>(Paragraph absent in snapshot)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="snapshot-diff-modal-footer">
          <div className="snapshot-diff-footer-stats">
            <span className="snapshot-diff-stat-chip">
              <strong>{currentSummary.modifiedCount}</strong> Modified
            </span>
            <span className="snapshot-diff-stat-chip added">
              <strong>+{currentSummary.addedCount}</strong> In Snapshot
            </span>
            <span className="snapshot-diff-stat-chip removed">
              <strong>-{currentSummary.removedCount}</strong> Only in Current
            </span>
            <span className="snapshot-diff-footer-tip">
              Tip: Click any <strong>← Move</strong> button to instantly adopt a paragraph from the snapshot into your working draft.
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
