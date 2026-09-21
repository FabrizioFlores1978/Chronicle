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
  Globe,
  FileEdit,
  Check,
  Layers,
} from 'lucide-react';
import { useEpub } from '../../context/EpubContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import {
  StorySnapshot,
  SnapshotRestoreOptions,
  EpubChapter,
  CharacterProfile,
  LocationCodexEntry,
  StoryTimeline,
  WorldbuildingNote,
  AuthorComment,
} from '../../types/project';

interface SelectiveRestoreDialogProps {
  snapshot: StorySnapshot;
  onClose: () => void;
  onRestore: (options: SnapshotRestoreOptions) => void;
}

const SelectiveRestoreDialog: React.FC<SelectiveRestoreDialogProps> = ({
  snapshot,
  onClose,
  onRestore,
}) => {
  const data = snapshot.data;
  const chapters = data.chapters || [];
  const characters = data.characters || [];
  const locations = data.locations || [];
  const timelines = data.timelines || [];
  const worldbuilding = data.worldbuilding || [];
  const comments = data.comments || [];
  const hasMetadata = !!data.metadata;
  const hasSynopsis = !!(data.synopsis || data.customNotes);

  // Category selections
  const [restoreChapters, setRestoreChapters] = useState(chapters.length > 0);
  const [restoreCharacters, setRestoreCharacters] = useState(characters.length > 0);
  const [restoreLocations, setRestoreLocations] = useState(locations.length > 0);
  const [restoreTimelines, setRestoreTimelines] = useState(timelines.length > 0);
  const [restoreWorldbuilding, setRestoreWorldbuilding] = useState(worldbuilding.length > 0);
  const [restoreComments, setRestoreComments] = useState(comments.length > 0);
  const [restoreMetadata, setRestoreMetadata] = useState(hasMetadata);
  const [restoreSynopsis, setRestoreSynopsis] = useState(hasSynopsis);

  // Granular item selections (Sets of IDs)
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(
    () => new Set(chapters.map(c => c.id))
  );
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(
    () => new Set(characters.map(c => c.id))
  );
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(
    () => new Set(locations.map(l => l.id))
  );
  const [selectedTimelineIds, setSelectedTimelineIds] = useState<Set<string>>(
    () => new Set(timelines.map(t => t.id))
  );
  const [selectedWorldbuildingIds, setSelectedWorldbuildingIds] = useState<Set<string>>(
    () => new Set(worldbuilding.map(w => w.id))
  );
  const [selectedCommentIds, setSelectedCommentIds] = useState<Set<string>>(
    () => new Set(comments.map(c => c.id))
  );

  // Expanded drilldown accordion
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSectionExpand = (section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  // Toggle full categories
  const handleToggleCategory = (category: string) => {
    switch (category) {
      case 'chapters': {
        const next = !restoreChapters;
        setRestoreChapters(next);
        setSelectedChapterIds(next ? new Set(chapters.map(c => c.id)) : new Set());
        break;
      }
      case 'characters': {
        const next = !restoreCharacters;
        setRestoreCharacters(next);
        setSelectedCharacterIds(next ? new Set(characters.map(c => c.id)) : new Set());
        break;
      }
      case 'locations': {
        const next = !restoreLocations;
        setRestoreLocations(next);
        setSelectedLocationIds(next ? new Set(locations.map(l => l.id)) : new Set());
        break;
      }
      case 'timelines': {
        const next = !restoreTimelines;
        setRestoreTimelines(next);
        setSelectedTimelineIds(next ? new Set(timelines.map(t => t.id)) : new Set());
        break;
      }
      case 'worldbuilding': {
        const next = !restoreWorldbuilding;
        setRestoreWorldbuilding(next);
        setSelectedWorldbuildingIds(next ? new Set(worldbuilding.map(w => w.id)) : new Set());
        break;
      }
      case 'comments': {
        const next = !restoreComments;
        setRestoreComments(next);
        setSelectedCommentIds(next ? new Set(comments.map(c => c.id)) : new Set());
        break;
      }
      case 'metadata':
        setRestoreMetadata(prev => !prev);
        break;
      case 'synopsis':
        setRestoreSynopsis(prev => !prev);
        break;
    }
  };

  // Toggle granular items
  const toggleItem = (
    id: string,
    currentSet: Set<string>,
    setFunc: React.Dispatch<React.SetStateAction<Set<string>>>,
    setCategoryFunc: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const next = new Set(currentSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setFunc(next);
    setCategoryFunc(next.size > 0);
  };

  // Presets
  const applyPresetAll = () => {
    setRestoreChapters(chapters.length > 0);
    setSelectedChapterIds(new Set(chapters.map(c => c.id)));
    setRestoreCharacters(characters.length > 0);
    setSelectedCharacterIds(new Set(characters.map(c => c.id)));
    setRestoreLocations(locations.length > 0);
    setSelectedLocationIds(new Set(locations.map(l => l.id)));
    setRestoreTimelines(timelines.length > 0);
    setSelectedTimelineIds(new Set(timelines.map(t => t.id)));
    setRestoreWorldbuilding(worldbuilding.length > 0);
    setSelectedWorldbuildingIds(new Set(worldbuilding.map(w => w.id)));
    setRestoreComments(comments.length > 0);
    setSelectedCommentIds(new Set(comments.map(c => c.id)));
    setRestoreMetadata(hasMetadata);
    setRestoreSynopsis(hasSynopsis);
  };

  const applyPresetNone = () => {
    setRestoreChapters(false);
    setSelectedChapterIds(new Set());
    setRestoreCharacters(false);
    setSelectedCharacterIds(new Set());
    setRestoreLocations(false);
    setSelectedLocationIds(new Set());
    setRestoreTimelines(false);
    setSelectedTimelineIds(new Set());
    setRestoreWorldbuilding(false);
    setSelectedWorldbuildingIds(new Set());
    setRestoreComments(false);
    setSelectedCommentIds(new Set());
    setRestoreMetadata(false);
    setRestoreSynopsis(false);
  };

  const applyPresetManuscriptOnly = () => {
    applyPresetNone();
    setRestoreChapters(chapters.length > 0);
    setSelectedChapterIds(new Set(chapters.map(c => c.id)));
    setRestoreMetadata(hasMetadata);
    setRestoreSynopsis(hasSynopsis);
  };

  const applyPresetWorldAndCast = () => {
    applyPresetNone();
    setRestoreCharacters(characters.length > 0);
    setSelectedCharacterIds(new Set(characters.map(c => c.id)));
    setRestoreLocations(locations.length > 0);
    setSelectedLocationIds(new Set(locations.map(l => l.id)));
    setRestoreTimelines(timelines.length > 0);
    setSelectedTimelineIds(new Set(timelines.map(t => t.id)));
    setRestoreWorldbuilding(worldbuilding.length > 0);
    setSelectedWorldbuildingIds(new Set(worldbuilding.map(w => w.id)));
  };

  // Check active counts
  const anySelected =
    restoreChapters ||
    restoreCharacters ||
    restoreLocations ||
    restoreTimelines ||
    restoreWorldbuilding ||
    restoreComments ||
    restoreMetadata ||
    restoreSynopsis;

  const totalPossibleCategories = [
    chapters.length > 0,
    characters.length > 0,
    locations.length > 0,
    timelines.length > 0,
    worldbuilding.length > 0,
    comments.length > 0,
    hasMetadata,
    hasSynopsis,
  ].filter(Boolean).length;

  const activeCategoriesCount = [
    restoreChapters,
    restoreCharacters,
    restoreLocations,
    restoreTimelines,
    restoreWorldbuilding,
    restoreComments,
    restoreMetadata,
    restoreSynopsis,
  ].filter(Boolean).length;

  const isEntireSnapshot =
    activeCategoriesCount === totalPossibleCategories &&
    selectedChapterIds.size === chapters.length &&
    selectedCharacterIds.size === characters.length &&
    selectedLocationIds.size === locations.length &&
    selectedTimelineIds.size === timelines.length &&
    selectedWorldbuildingIds.size === worldbuilding.length &&
    selectedCommentIds.size === comments.length;

  const handleExecuteRestore = () => {
    if (!anySelected) return;

    const options: SnapshotRestoreOptions = {
      chapters: restoreChapters,
      selectedChapterIds:
        restoreChapters && selectedChapterIds.size < chapters.length
          ? Array.from(selectedChapterIds)
          : undefined,
      characters: restoreCharacters,
      selectedCharacterIds:
        restoreCharacters && selectedCharacterIds.size < characters.length
          ? Array.from(selectedCharacterIds)
          : undefined,
      locations: restoreLocations,
      selectedLocationIds:
        restoreLocations && selectedLocationIds.size < locations.length
          ? Array.from(selectedLocationIds)
          : undefined,
      timelines: restoreTimelines,
      selectedTimelineIds:
        restoreTimelines && selectedTimelineIds.size < timelines.length
          ? Array.from(selectedTimelineIds)
          : undefined,
      worldbuilding: restoreWorldbuilding,
      selectedWorldbuildingIds:
        restoreWorldbuilding && selectedWorldbuildingIds.size < worldbuilding.length
          ? Array.from(selectedWorldbuildingIds)
          : undefined,
      comments: restoreComments,
      selectedCommentIds:
        restoreComments && selectedCommentIds.size < comments.length
          ? Array.from(selectedCommentIds)
          : undefined,
      metadata: restoreMetadata,
      synopsis: restoreSynopsis,
    };

    onRestore(options);
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
      style={{ zIndex: 1300, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="snapshot-selective-restore-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="snapshots-modal-header" style={{ borderBottom: '1px solid var(--border-medium)' }}>
          <div className="snapshots-header-title-row">
            <div className="snapshots-header-icon-badge">
              <RotateCcw size={18} />
            </div>
            <div>
              <div className="snapshots-header-title-flex">
                <h3 className="snapshots-modal-title">Restore from Snapshot</h3>
                <span className="snapshots-count-pill" style={{ color: 'var(--accent-primary)', borderColor: 'rgba(99,102,241,0.3)' }}>
                  {formatDate(snapshot.createdAt)}
                </span>
              </div>
              <p className="snapshots-modal-subtitle">
                Target: <strong>"{snapshot.name}"</strong> • Choose which items to restore
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon btn-sm"
            onClick={onClose}
            aria-label="Close restore dialog"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="snapshots-modal-body" style={{ gap: '0.9rem', padding: '1rem 1.25rem' }}>
          {/* Quick Presets Bar */}
          <div className="snapshot-restore-presets-bar">
            <span className="snapshot-restore-presets-label">Quick Select:</span>
            <div className="snapshot-restore-presets-actions">
              <button
                type="button"
                className="snapshot-restore-preset-btn"
                onClick={applyPresetAll}
              >
                Select All
              </button>
              <button
                type="button"
                className="snapshot-restore-preset-btn"
                onClick={applyPresetNone}
              >
                Clear All
              </button>
              <button
                type="button"
                className="snapshot-restore-preset-btn"
                onClick={applyPresetManuscriptOnly}
              >
                Manuscript Only
              </button>
              <button
                type="button"
                className="snapshot-restore-preset-btn"
                onClick={applyPresetWorldAndCast}
              >
                World & Cast
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="snapshot-restore-categories-grid">
            {/* 1. Chapters & Manuscript */}
            <div className={`snapshot-restore-card ${restoreChapters ? 'checked' : ''} ${chapters.length === 0 ? 'disabled' : ''}`}>
              <div
                className="snapshot-restore-card-header"
                onClick={() => chapters.length > 0 && handleToggleCategory('chapters')}
              >
                <div className="snapshot-restore-card-left">
                  <input
                    type="checkbox"
                    className="snapshot-restore-checkbox"
                    checked={restoreChapters}
                    disabled={chapters.length === 0}
                    onChange={() => {}}
                  />
                  <div className="snapshot-restore-icon-box">
                    <BookOpen size={15} />
                  </div>
                  <div className="snapshot-restore-card-titles">
                    <span className="snapshot-restore-card-title">
                      Manuscript Chapters & Text
                    </span>
                    <span className="snapshot-restore-card-subtitle">
                      {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} • {(snapshot.totalWordCount || 0).toLocaleString()} words
                    </span>
                  </div>
                </div>
                <div className="snapshot-restore-card-right">
                  <span className="snapshot-restore-badge">
                    {chapters.length === 0 ? '0 items' : `${selectedChapterIds.size}/${chapters.length}`}
                  </span>
                  {chapters.length > 0 && (
                    <button
                      type="button"
                      className="snapshot-restore-drilldown-toggle"
                      onClick={e => {
                        e.stopPropagation();
                        toggleSectionExpand('chapters');
                      }}
                      title="Inspect / select individual chapters"
                    >
                      {expandedSection === 'chapters' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {expandedSection === 'chapters' && chapters.length > 0 && (
                <div className="snapshot-restore-drilldown-panel">
                  <div className="snapshot-restore-drilldown-header">
                    <span>Individual Chapters</span>
                    <span>{selectedChapterIds.size} of {chapters.length} selected</span>
                  </div>
                  <div className="snapshot-restore-drilldown-grid">
                    {chapters.map((ch: EpubChapter, idx: number) => {
                      const isSelected = selectedChapterIds.has(ch.id);
                      return (
                        <div
                          key={ch.id || idx}
                          className={`snapshot-restore-drilldown-item ${isSelected ? 'item-selected' : ''}`}
                          onClick={() =>
                            toggleItem(ch.id, selectedChapterIds, setSelectedChapterIds, setRestoreChapters)
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="snapshot-restore-checkbox"
                            style={{ width: '13px', height: '13px' }}
                          />
                          <span className="snapshot-restore-drilldown-item-name" title={ch.title}>
                            {idx + 1}. {ch.title || 'Untitled Chapter'}
                          </span>
                          <span className="snapshot-restore-drilldown-item-meta">
                            {(ch.wordCount || 0).toLocaleString()}w
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Character Sheets */}
            <div className={`snapshot-restore-card ${restoreCharacters ? 'checked' : ''} ${characters.length === 0 ? 'disabled' : ''}`}>
              <div
                className="snapshot-restore-card-header"
                onClick={() => characters.length > 0 && handleToggleCategory('characters')}
              >
                <div className="snapshot-restore-card-left">
                  <input
                    type="checkbox"
                    className="snapshot-restore-checkbox"
                    checked={restoreCharacters}
                    disabled={characters.length === 0}
                    onChange={() => {}}
                  />
                  <div className="snapshot-restore-icon-box">
                    <Users size={15} />
                  </div>
                  <div className="snapshot-restore-card-titles">
                    <span className="snapshot-restore-card-title">
                      Character Sheets & Profiles
                    </span>
                    <span className="snapshot-restore-card-subtitle">
                      {characters.length} {characters.length === 1 ? 'character profile' : 'character profiles'}
                    </span>
                  </div>
                </div>
                <div className="snapshot-restore-card-right">
                  <span className="snapshot-restore-badge">
                    {characters.length === 0 ? '0 items' : `${selectedCharacterIds.size}/${characters.length}`}
                  </span>
                  {characters.length > 0 && (
                    <button
                      type="button"
                      className="snapshot-restore-drilldown-toggle"
                      onClick={e => {
                        e.stopPropagation();
                        toggleSectionExpand('characters');
                      }}
                      title="Inspect / select individual character profiles"
                    >
                      {expandedSection === 'characters' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {expandedSection === 'characters' && characters.length > 0 && (
                <div className="snapshot-restore-drilldown-panel">
                  <div className="snapshot-restore-drilldown-header">
                    <span>Individual Character Profiles</span>
                    <span>{selectedCharacterIds.size} of {characters.length} selected</span>
                  </div>
                  <div className="snapshot-restore-drilldown-grid">
                    {characters.map((c: CharacterProfile) => {
                      const isSelected = selectedCharacterIds.has(c.id);
                      return (
                        <div
                          key={c.id}
                          className={`snapshot-restore-drilldown-item ${isSelected ? 'item-selected' : ''}`}
                          onClick={() =>
                            toggleItem(c.id, selectedCharacterIds, setSelectedCharacterIds, setRestoreCharacters)
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="snapshot-restore-checkbox"
                            style={{ width: '13px', height: '13px' }}
                          />
                          <span
                            className="snapshot-restore-avatar-dot"
                            style={{ backgroundColor: c.color || 'var(--accent-primary)' }}
                          />
                          <span className="snapshot-restore-drilldown-item-name" title={c.name}>
                            {c.name || 'Unnamed Character'}
                          </span>
                          <span className="snapshot-restore-drilldown-item-meta">{c.role}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Story Timelines */}
            <div className={`snapshot-restore-card ${restoreTimelines ? 'checked' : ''} ${timelines.length === 0 ? 'disabled' : ''}`}>
              <div
                className="snapshot-restore-card-header"
                onClick={() => timelines.length > 0 && handleToggleCategory('timelines')}
              >
                <div className="snapshot-restore-card-left">
                  <input
                    type="checkbox"
                    className="snapshot-restore-checkbox"
                    checked={restoreTimelines}
                    disabled={timelines.length === 0}
                    onChange={() => {}}
                  />
                  <div className="snapshot-restore-icon-box">
                    <GitCommit size={15} />
                  </div>
                  <div className="snapshot-restore-card-titles">
                    <span className="snapshot-restore-card-title">Story Timelines</span>
                    <span className="snapshot-restore-card-subtitle">
                      {timelines.length} {timelines.length === 1 ? 'timeline' : 'timelines'}
                    </span>
                  </div>
                </div>
                <div className="snapshot-restore-card-right">
                  <span className="snapshot-restore-badge">
                    {timelines.length === 0 ? '0 items' : `${selectedTimelineIds.size}/${timelines.length}`}
                  </span>
                  {timelines.length > 0 && (
                    <button
                      type="button"
                      className="snapshot-restore-drilldown-toggle"
                      onClick={e => {
                        e.stopPropagation();
                        toggleSectionExpand('timelines');
                      }}
                      title="Inspect / select individual timelines"
                    >
                      {expandedSection === 'timelines' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {expandedSection === 'timelines' && timelines.length > 0 && (
                <div className="snapshot-restore-drilldown-panel">
                  <div className="snapshot-restore-drilldown-header">
                    <span>Individual Timelines</span>
                    <span>{selectedTimelineIds.size} of {timelines.length} selected</span>
                  </div>
                  <div className="snapshot-restore-drilldown-grid">
                    {timelines.map((t: StoryTimeline) => {
                      const isSelected = selectedTimelineIds.has(t.id);
                      const eventCount = (t.segments || []).reduce((acc, s) => acc + (s.events?.length || 0), 0);
                      return (
                        <div
                          key={t.id}
                          className={`snapshot-restore-drilldown-item ${isSelected ? 'item-selected' : ''}`}
                          onClick={() =>
                            toggleItem(t.id, selectedTimelineIds, setSelectedTimelineIds, setRestoreTimelines)
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="snapshot-restore-checkbox"
                            style={{ width: '13px', height: '13px' }}
                          />
                          <span
                            className="snapshot-restore-avatar-dot"
                            style={{ backgroundColor: t.color || '#6366f1' }}
                          />
                          <span className="snapshot-restore-drilldown-item-name" title={t.title}>
                            {t.title || 'Untitled Timeline'}
                          </span>
                          <span className="snapshot-restore-drilldown-item-meta">
                            {eventCount} {eventCount === 1 ? 'event' : 'events'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Location Codex */}
            <div className={`snapshot-restore-card ${restoreLocations ? 'checked' : ''} ${locations.length === 0 ? 'disabled' : ''}`}>
              <div
                className="snapshot-restore-card-header"
                onClick={() => locations.length > 0 && handleToggleCategory('locations')}
              >
                <div className="snapshot-restore-card-left">
                  <input
                    type="checkbox"
                    className="snapshot-restore-checkbox"
                    checked={restoreLocations}
                    disabled={locations.length === 0}
                    onChange={() => {}}
                  />
                  <div className="snapshot-restore-icon-box">
                    <MapPin size={15} />
                  </div>
                  <div className="snapshot-restore-card-titles">
                    <span className="snapshot-restore-card-title">Location Codex</span>
                    <span className="snapshot-restore-card-subtitle">
                      {locations.length} {locations.length === 1 ? 'location entry' : 'location entries'}
                    </span>
                  </div>
                </div>
                <div className="snapshot-restore-card-right">
                  <span className="snapshot-restore-badge">
                    {locations.length === 0 ? '0 items' : `${selectedLocationIds.size}/${locations.length}`}
                  </span>
                  {locations.length > 0 && (
                    <button
                      type="button"
                      className="snapshot-restore-drilldown-toggle"
                      onClick={e => {
                        e.stopPropagation();
                        toggleSectionExpand('locations');
                      }}
                      title="Inspect / select individual locations"
                    >
                      {expandedSection === 'locations' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {expandedSection === 'locations' && locations.length > 0 && (
                <div className="snapshot-restore-drilldown-panel">
                  <div className="snapshot-restore-drilldown-header">
                    <span>Individual Locations</span>
                    <span>{selectedLocationIds.size} of {locations.length} selected</span>
                  </div>
                  <div className="snapshot-restore-drilldown-grid">
                    {locations.map((l: LocationCodexEntry) => {
                      const isSelected = selectedLocationIds.has(l.id);
                      return (
                        <div
                          key={l.id}
                          className={`snapshot-restore-drilldown-item ${isSelected ? 'item-selected' : ''}`}
                          onClick={() =>
                            toggleItem(l.id, selectedLocationIds, setSelectedLocationIds, setRestoreLocations)
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="snapshot-restore-checkbox"
                            style={{ width: '13px', height: '13px' }}
                          />
                          <span
                            className="snapshot-restore-avatar-dot"
                            style={{ backgroundColor: l.color || '#10b981' }}
                          />
                          <span className="snapshot-restore-drilldown-item-name" title={l.name}>
                            {l.name || 'Unnamed Location'}
                          </span>
                          <span className="snapshot-restore-drilldown-item-meta">{l.type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Worldbuilding Lore */}
            <div className={`snapshot-restore-card ${restoreWorldbuilding ? 'checked' : ''} ${worldbuilding.length === 0 ? 'disabled' : ''}`}>
              <div
                className="snapshot-restore-card-header"
                onClick={() => worldbuilding.length > 0 && handleToggleCategory('worldbuilding')}
              >
                <div className="snapshot-restore-card-left">
                  <input
                    type="checkbox"
                    className="snapshot-restore-checkbox"
                    checked={restoreWorldbuilding}
                    disabled={worldbuilding.length === 0}
                    onChange={() => {}}
                  />
                  <div className="snapshot-restore-icon-box">
                    <Globe size={15} />
                  </div>
                  <div className="snapshot-restore-card-titles">
                    <span className="snapshot-restore-card-title">Worldbuilding Notes</span>
                    <span className="snapshot-restore-card-subtitle">
                      {worldbuilding.length} {worldbuilding.length === 1 ? 'lore entry' : 'lore entries'}
                    </span>
                  </div>
                </div>
                <div className="snapshot-restore-card-right">
                  <span className="snapshot-restore-badge">
                    {worldbuilding.length === 0 ? '0 items' : `${selectedWorldbuildingIds.size}/${worldbuilding.length}`}
                  </span>
                  {worldbuilding.length > 0 && (
                    <button
                      type="button"
                      className="snapshot-restore-drilldown-toggle"
                      onClick={e => {
                        e.stopPropagation();
                        toggleSectionExpand('worldbuilding');
                      }}
                      title="Inspect / select individual worldbuilding notes"
                    >
                      {expandedSection === 'worldbuilding' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {expandedSection === 'worldbuilding' && worldbuilding.length > 0 && (
                <div className="snapshot-restore-drilldown-panel">
                  <div className="snapshot-restore-drilldown-header">
                    <span>Individual Lore Notes</span>
                    <span>{selectedWorldbuildingIds.size} of {worldbuilding.length} selected</span>
                  </div>
                  <div className="snapshot-restore-drilldown-grid">
                    {worldbuilding.map((w: WorldbuildingNote) => {
                      const isSelected = selectedWorldbuildingIds.has(w.id);
                      return (
                        <div
                          key={w.id}
                          className={`snapshot-restore-drilldown-item ${isSelected ? 'item-selected' : ''}`}
                          onClick={() =>
                            toggleItem(w.id, selectedWorldbuildingIds, setSelectedWorldbuildingIds, setRestoreWorldbuilding)
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="snapshot-restore-checkbox"
                            style={{ width: '13px', height: '13px' }}
                          />
                          <span className="snapshot-restore-drilldown-item-name" title={w.title}>
                            {w.title || 'Untitled Note'}
                          </span>
                          <span className="snapshot-restore-drilldown-item-meta">{w.category}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Author Comments & Highlights */}
            <div className={`snapshot-restore-card ${restoreComments ? 'checked' : ''} ${comments.length === 0 ? 'disabled' : ''}`}>
              <div
                className="snapshot-restore-card-header"
                onClick={() => comments.length > 0 && handleToggleCategory('comments')}
              >
                <div className="snapshot-restore-card-left">
                  <input
                    type="checkbox"
                    className="snapshot-restore-checkbox"
                    checked={restoreComments}
                    disabled={comments.length === 0}
                    onChange={() => {}}
                  />
                  <div className="snapshot-restore-icon-box">
                    <MessageSquare size={15} />
                  </div>
                  <div className="snapshot-restore-card-titles">
                    <span className="snapshot-restore-card-title">Author Comments</span>
                    <span className="snapshot-restore-card-subtitle">
                      {comments.length} {comments.length === 1 ? 'comment & highlight' : 'comments & highlights'}
                    </span>
                  </div>
                </div>
                <div className="snapshot-restore-card-right">
                  <span className="snapshot-restore-badge">
                    {comments.length === 0 ? '0 items' : `${selectedCommentIds.size}/${comments.length}`}
                  </span>
                  {comments.length > 0 && (
                    <button
                      type="button"
                      className="snapshot-restore-drilldown-toggle"
                      onClick={e => {
                        e.stopPropagation();
                        toggleSectionExpand('comments');
                      }}
                      title="Inspect / select individual comments"
                    >
                      {expandedSection === 'comments' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {expandedSection === 'comments' && comments.length > 0 && (
                <div className="snapshot-restore-drilldown-panel">
                  <div className="snapshot-restore-drilldown-header">
                    <span>Individual Comments</span>
                    <span>{selectedCommentIds.size} of {comments.length} selected</span>
                  </div>
                  <div className="snapshot-restore-drilldown-grid">
                    {comments.map((c: AuthorComment) => {
                      const isSelected = selectedCommentIds.has(c.id);
                      return (
                        <div
                          key={c.id}
                          className={`snapshot-restore-drilldown-item ${isSelected ? 'item-selected' : ''}`}
                          onClick={() =>
                            toggleItem(c.id, selectedCommentIds, setSelectedCommentIds, setRestoreComments)
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="snapshot-restore-checkbox"
                            style={{ width: '13px', height: '13px' }}
                          />
                          <span
                            className="snapshot-restore-avatar-dot"
                            style={{ backgroundColor: c.color || '#f59e0b' }}
                          />
                          <span className="snapshot-restore-drilldown-item-name" title={c.comment}>
                            {c.comment || c.selectedText || 'Comment'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 7. Book Metadata */}
            <div className={`snapshot-restore-card ${restoreMetadata ? 'checked' : ''} ${!hasMetadata ? 'disabled' : ''}`}>
              <div
                className="snapshot-restore-card-header"
                onClick={() => hasMetadata && handleToggleCategory('metadata')}
              >
                <div className="snapshot-restore-card-left">
                  <input
                    type="checkbox"
                    className="snapshot-restore-checkbox"
                    checked={restoreMetadata}
                    disabled={!hasMetadata}
                    onChange={() => {}}
                  />
                  <div className="snapshot-restore-icon-box">
                    <FileText size={15} />
                  </div>
                  <div className="snapshot-restore-card-titles">
                    <span className="snapshot-restore-card-title">Book Metadata & Details</span>
                    <span className="snapshot-restore-card-subtitle">
                      {data.metadata?.title || 'Untitled'} by {data.metadata?.creator || 'Author'}
                    </span>
                  </div>
                </div>
                <div className="snapshot-restore-card-right">
                  <span className="snapshot-restore-badge">
                    {restoreMetadata ? 'Selected' : 'Unchecked'}
                  </span>
                </div>
              </div>
            </div>

            {/* 8. Synopsis & Custom Notes */}
            <div className={`snapshot-restore-card ${restoreSynopsis ? 'checked' : ''} ${!hasSynopsis ? 'disabled' : ''}`}>
              <div
                className="snapshot-restore-card-header"
                onClick={() => hasSynopsis && handleToggleCategory('synopsis')}
              >
                <div className="snapshot-restore-card-left">
                  <input
                    type="checkbox"
                    className="snapshot-restore-checkbox"
                    checked={restoreSynopsis}
                    disabled={!hasSynopsis}
                    onChange={() => {}}
                  />
                  <div className="snapshot-restore-icon-box">
                    <FileEdit size={15} />
                  </div>
                  <div className="snapshot-restore-card-titles">
                    <span className="snapshot-restore-card-title">Synopsis & Custom Notes</span>
                    <span className="snapshot-restore-card-subtitle">
                      Story synopsis and scratchpad project notes
                    </span>
                  </div>
                </div>
                <div className="snapshot-restore-card-right">
                  <span className="snapshot-restore-badge">
                    {restoreSynopsis ? 'Selected' : 'Unchecked'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning / Advice tip */}
          <div className="snapshot-confirm-warning-box" style={{ marginTop: '0.2rem' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>
              Only the selected items will be restored from snapshot <strong>"{snapshot.name}"</strong>. Unselected sections in your active manuscript will remain untouched.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="snapshot-confirm-footer">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!anySelected}
            onClick={handleExecuteRestore}
          >
            <RotateCcw size={14} />
            <span>
              {isEntireSnapshot
                ? 'Restore Entire Snapshot'
                : anySelected
                ? `Restore Selected Items (${activeCategoriesCount})`
                : 'Select Items to Restore'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

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

  const handleExecuteRestore = (options: SnapshotRestoreOptions) => {
    if (!confirmRestoreId) return;
    restoreSnapshot(confirmRestoreId, options);
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
                            title="Restore active manuscript or selective items from this snapshot"
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

      {/* Selective Snapshot Restore Dialog */}
      {confirmRestoreId && snapshotToRestore && (
        <SelectiveRestoreDialog
          snapshot={snapshotToRestore}
          onClose={() => setConfirmRestoreId(null)}
          onRestore={handleExecuteRestore}
        />
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
