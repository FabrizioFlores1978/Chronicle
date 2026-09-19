import React, { useState, useMemo } from 'react';
import { useEpub } from '../../context/EpubContext';
import {
  Compass,
  Plus,
  Search,
  Trash2,
  CheckSquare,
  Square,
  ArrowLeft,
  LayoutGrid,
  Edit3,
  BookOpen,
  MapPin,
  Sparkles,
  FileText,
  Activity,
  Filter,
  Eye,
  Volume2,
  Wind,
  Thermometer,
  ShieldAlert,
  Users,
  Check,
} from 'lucide-react';

const LOCATION_TYPE_OPTIONS = [
  'All',
  'Interior',
  'Exterior',
  'City / Settlement',
  'Wilderness',
  'Landmark',
  'Realm',
  'Room / Chamber',
];

const SCALE_OPTIONS = [
  'Chamber / Room',
  'Building / Structure',
  'Settlement / Town',
  'District',
  'Region / Wilderness',
  'Realm / World',
];

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#64748b', // Slate
  '#14b8a6', // Teal
];

const FEATURE_CATEGORIES = [
  { id: 'landmark', label: 'Landmark' },
  { id: 'secret', label: 'Secret' },
  { id: 'hazard', label: 'Hazard' },
  { id: 'resource', label: 'Resource' },
  { id: 'clue', label: 'Clue' },
  { id: 'custom', label: 'Custom' },
];

export const LocationStudio: React.FC = () => {
  const {
    locations,
    characters,
    addLocation,
    updateLocation,
    deleteLocation,
    toggleLocationFeature,
    addLocationFeature,
    removeLocationFeature,
    castPresenceData,
    runCastPresenceAnalysis,
    setActiveChapterId,
    setViewMode,
  } = useEpub();

  // Selection & active tabs
  const [selectedId, setSelectedId] = useState<string | null>(locations[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'sensory' | 'features' | 'lore' | 'connections' | 'footprint' | 'notes'>('sensory');

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [scaleFilter, setScaleFilter] = useState<string>('All');

  // Form input for new feature
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureCategory, setNewFeatureCategory] = useState('landmark');

  // Ensure valid selection
  const selectedLocation = useMemo(() => {
    if (selectedId) {
      const found = locations.find(l => l.id === selectedId);
      if (found) return found;
    }
    return locations[0] || null;
  }, [locations, selectedId]);

  // Filtered locations list for master pane
  const filteredLocations = useMemo(() => {
    let list = [...locations];

    if (typeFilter !== 'All') {
      list = list.filter(l => l.type === typeFilter);
    }

    if (scaleFilter !== 'All') {
      list = list.filter(l => l.scale === scaleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          (l.aliases && l.aliases.toLowerCase().includes(q)) ||
          (l.region && l.region.toLowerCase().includes(q)) ||
          (l.oneLineSummary && l.oneLineSummary.toLowerCase().includes(q))
      );
    }

    return list;
  }, [locations, typeFilter, scaleFilter, searchQuery]);

  // Create new location action
  const handleCreateNew = () => {
    const newId = addLocation({
      name: `New Setting ${locations.length + 1}`,
      type: 'Interior',
      scale: 'Building / Structure',
      color: PRESET_COLORS[locations.length % PRESET_COLORS.length],
      features: [
        {
          id: `feat-${Date.now()}-1`,
          name: 'Primary Focal Landmark',
          category: 'landmark',
          explored: false,
        },
      ],
    });
    setSelectedId(newId);
    setActiveTab('sensory');
  };

  // Feature submission
  const handleAddFeatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !newFeatureName.trim()) return;
    addLocationFeature(selectedLocation.id, newFeatureName.trim(), newFeatureCategory);
    setNewFeatureName('');
  };

  // Connected character toggle
  const handleToggleCharacterLink = (charId: string) => {
    if (!selectedLocation) return;
    const current = selectedLocation.connectedCharacters || [];
    const updated = current.includes(charId)
      ? current.filter(id => id !== charId)
      : [...current, charId];
    updateLocation(selectedLocation.id, { connectedCharacters: updated });
  };

  // Features progress
  const exploredFeatures = selectedLocation?.features.filter(f => f.explored).length || 0;
  const totalFeatures = selectedLocation?.features.length || 0;
  const featuresPercent = totalFeatures > 0 ? Math.round((exploredFeatures / totalFeatures) * 100) : 0;

  // Chapter presence data for selected location
  const locationPresenceInfo = useMemo(() => {
    if (!selectedLocation || !castPresenceData) return null;
    const chaptersAppeared = castPresenceData.chapters.filter(ch => {
      const key = `${selectedLocation.id}::${ch.id}`;
      const pres = castPresenceData.presenceMap[key];
      return pres && pres.count > 0;
    });

    const totalMentions = chaptersAppeared.reduce((acc, ch) => {
      const pres = castPresenceData.presenceMap[`${selectedLocation.id}::${ch.id}`];
      return acc + (pres?.count || 0);
    }, 0);

    return {
      chapters: chaptersAppeared,
      totalMentions,
    };
  }, [selectedLocation, castPresenceData]);

  return (
    <div className="entity-studio-container">
      {/* Top Studio Toolbar */}
      <div className="entity-studio-toolbar">
        <div className="entity-toolbar-left">
          <button
            className="btn btn-sm btn-ghost return-writing-btn"
            onClick={() => setViewMode('editor')}
            title="Return to Writing mode"
          >
            <ArrowLeft size={14} />
            <Edit3 size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Writing</span>
          </button>

          <div className="entity-studio-brand">
            <div className="entity-studio-icon-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Compass size={16} />
            </div>
            <div>
              <h2 className="entity-studio-title">Location Codex Studio</h2>
              <span className="entity-studio-count">
                {locations.length} {locations.length === 1 ? 'setting' : 'settings'} in manuscript
              </span>
            </div>
          </div>
        </div>

        <div className="entity-toolbar-right">
          {/* Search box */}
          <div className="entity-search-box">
            <Search size={14} className="entity-search-icon" />
            <input
              type="text"
              placeholder="Search locations, regions, landmarks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="entity-search-input"
            />
            {searchQuery && (
              <button className="entity-search-clear" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="entity-dropdown-wrap">
            <Filter size={13} color="var(--text-muted)" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="entity-select-control"
            >
              {LOCATION_TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Types' : t}
                </option>
              ))}
            </select>
          </div>

          {/* Scale filter */}
          <div className="entity-dropdown-wrap">
            <select
              value={scaleFilter}
              onChange={e => setScaleFilter(e.target.value)}
              className="entity-select-control"
            >
              <option value="All">All Scales</option>
              {SCALE_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Presence Grid shortcut */}
          <button
            className="btn btn-sm btn-outline entity-action-btn"
            onClick={() => setViewMode('cast-grid')}
            title="View in Presence Grid"
          >
            <LayoutGrid size={13} />
            <span>Presence Grid</span>
          </button>

          {/* New Location Button */}
          <button className="btn btn-sm btn-primary entity-action-btn" onClick={handleCreateNew}>
            <Plus size={14} />
            <span>New Location</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: Two-Pane Master-Detail */}
      <div className="entity-studio-workspace">
        {/* Left Master Pane: Location Roster */}
        <aside className="entity-master-pane">
          <div className="entity-master-header">
            <span className="master-header-label">Locations Codex</span>
            <span className="master-header-badge">{filteredLocations.length}</span>
          </div>

          <div className="entity-card-list">
            {filteredLocations.length === 0 ? (
              <div className="entity-list-empty">
                <span>No locations found.</span>
              </div>
            ) : (
              filteredLocations.map(loc => {
                const isSelected = selectedLocation?.id === loc.id;
                const locExplored = loc.features.filter(f => f.explored).length;
                const locTotal = loc.features.length;
                const locPercent = locTotal > 0 ? Math.round((locExplored / locTotal) * 100) : 0;

                return (
                  <div
                    key={loc.id}
                    className={`entity-roster-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedId(loc.id)}
                    style={{
                      '--card-color': loc.color || '#10b981',
                    } as React.CSSProperties}
                  >
                    <div className="roster-card-header">
                      <div
                        className="roster-avatar-chip"
                        style={{ backgroundColor: loc.color || '#10b981' }}
                      >
                        <MapPin size={14} />
                      </div>

                      <div className="roster-card-title-group">
                        <div className="roster-card-name">{loc.name}</div>
                        <div className="roster-card-role-line">
                          <span className="roster-role-badge">{loc.type}</span>
                          {loc.scale && (
                            <span className="roster-archetype-badge">{loc.scale}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {loc.oneLineSummary ? (
                      <div className="roster-card-summary">{loc.oneLineSummary}</div>
                    ) : loc.region ? (
                      <div className="roster-card-summary" style={{ fontStyle: 'normal', color: 'var(--text-muted)' }}>
                        Region: {loc.region}
                      </div>
                    ) : null}

                    <div className="roster-card-footer">
                      {locTotal > 0 ? (
                        <div className="roster-progress-group">
                          <div className="roster-progress-track">
                            <div
                              className="roster-progress-fill"
                              style={{
                                width: `${locPercent}%`,
                                backgroundColor: loc.color || '#10b981',
                              }}
                            />
                          </div>
                          <span className="roster-progress-text">
                            {locExplored}/{locTotal} landmarks
                          </span>
                        </div>
                      ) : (
                        <span className="roster-no-traits">No points of interest</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Detail Workspace: Location Dossier */}
        {selectedLocation ? (
          <main className="entity-detail-workspace">
            {/* Dossier Hero Header */}
            <div className="dossier-hero-header">
              <div className="dossier-hero-identity">
                <div
                  className="dossier-avatar-large"
                  style={{ backgroundColor: selectedLocation.color || '#10b981' }}
                  title="Location Map Color"
                >
                  <Compass size={24} />
                </div>

                <div className="dossier-title-editor">
                  <input
                    type="text"
                    className="dossier-name-input"
                    value={selectedLocation.name}
                    onChange={e => updateLocation(selectedLocation.id, { name: e.target.value })}
                    placeholder="Location / Setting Name..."
                  />

                  <div className="dossier-meta-controls">
                    <select
                      className="dossier-select-control"
                      value={selectedLocation.type}
                      onChange={e => updateLocation(selectedLocation.id, { type: e.target.value })}
                    >
                      {LOCATION_TYPE_OPTIONS.filter(t => t !== 'All').map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>

                    <select
                      className="dossier-select-control"
                      value={selectedLocation.scale || 'Building / Structure'}
                      onChange={e => updateLocation(selectedLocation.id, { scale: e.target.value })}
                    >
                      {SCALE_OPTIONS.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      className="dossier-inline-input"
                      placeholder="Region / Territory..."
                      value={selectedLocation.region || ''}
                      onChange={e => updateLocation(selectedLocation.id, { region: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Color Swatch Picker & Actions */}
              <div className="dossier-hero-actions">
                <div className="dossier-color-picker">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`dossier-color-dot ${selectedLocation.color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => updateLocation(selectedLocation.id, { color: c })}
                      title={`Select ${c}`}
                    />
                  ))}
                </div>

                <button
                  className="btn btn-sm btn-ghost delete-entity-btn"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${selectedLocation.name}"?`)) {
                      deleteLocation(selectedLocation.id);
                      setSelectedId(null);
                    }
                  }}
                  title="Delete setting"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Dossier Tabs Navigation */}
            <nav className="dossier-tabs-nav">
              <button
                className={`dossier-tab-btn ${activeTab === 'sensory' ? 'active' : ''}`}
                onClick={() => setActiveTab('sensory')}
              >
                <Sparkles size={14} />
                <span>Sensory & Atmosphere</span>
              </button>

              <button
                className={`dossier-tab-btn ${activeTab === 'features' ? 'active' : ''}`}
                onClick={() => setActiveTab('features')}
              >
                <CheckSquare size={14} />
                <span>Points of Interest ({selectedLocation.features.length})</span>
              </button>

              <button
                className={`dossier-tab-btn ${activeTab === 'lore' ? 'active' : ''}`}
                onClick={() => setActiveTab('lore')}
              >
                <ShieldAlert size={14} />
                <span>Lore, Rules & Hazards</span>
              </button>

              <button
                className={`dossier-tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
                onClick={() => setActiveTab('connections')}
              >
                <Users size={14} />
                <span>Narrative Connections ({selectedLocation.connectedCharacters?.length || 0})</span>
              </button>

              <button
                className={`dossier-tab-btn ${activeTab === 'footprint' ? 'active' : ''}`}
                onClick={() => setActiveTab('footprint')}
              >
                <Activity size={14} />
                <span>Story Footprint</span>
              </button>

              <button
                className={`dossier-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <FileText size={14} />
                <span>Author Scraps</span>
              </button>
            </nav>

            {/* Dossier Tab Content */}
            <div className="dossier-body-viewport">
              {/* Tab 1: Sensory & Atmosphere */}
              {activeTab === 'sensory' && (
                <div className="dossier-section animate-fadeIn">
                  <div className="form-group">
                    <label className="form-label">
                      <span>Aliases & Historical Names</span>
                      <span className="label-hint">
                        (Used for automatic match detection in the Presence Grid & Chapters)
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. The Long Hall, The Threshold (separated by commas)"
                      value={selectedLocation.aliases || ''}
                      onChange={e => updateLocation(selectedLocation.id, { aliases: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Atmosphere & Mood Palette</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Eerie, claustrophobic subterranean stillness, flickering torchlight..."
                      value={selectedLocation.atmosphere || ''}
                      onChange={e => updateLocation(selectedLocation.id, { atmosphere: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">One-Line Sensory Summary</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="A subterranean corridor of locked bronze doors smelling of beeswax and wet flagstone..."
                      value={selectedLocation.oneLineSummary || ''}
                      onChange={e => updateLocation(selectedLocation.id, { oneLineSummary: e.target.value })}
                    />
                  </div>

                  {/* 4 Sensory Dimension Cards */}
                  <div className="sensory-grid-2x2">
                    <div className="sensory-card">
                      <div className="sensory-card-header">
                        <Eye size={15} color="#3b82f6" />
                        <span>Sight & Architecture</span>
                      </div>
                      <textarea
                        className="sensory-textarea"
                        rows={3}
                        placeholder="Visual textures, shadows, colors, architectural grandeur, decay, light sources..."
                        value={selectedLocation.sight || ''}
                        onChange={e => updateLocation(selectedLocation.id, { sight: e.target.value })}
                      />
                    </div>

                    <div className="sensory-card">
                      <div className="sensory-card-header">
                        <Volume2 size={15} color="#8b5cf6" />
                        <span>Sound & Acoustics</span>
                      </div>
                      <textarea
                        className="sensory-textarea"
                        rows={3}
                        placeholder="Echoes, wind whistling through grates, muffled voices, distant church bells, water drips..."
                        value={selectedLocation.sound || ''}
                        onChange={e => updateLocation(selectedLocation.id, { sound: e.target.value })}
                      />
                    </div>

                    <div className="sensory-card">
                      <div className="sensory-card-header">
                        <Wind size={15} color="#10b981" />
                        <span>Smell & Scents</span>
                      </div>
                      <textarea
                        className="sensory-textarea"
                        rows={3}
                        placeholder="Sea salt brine, aged parchment, wood smoke, roasted coffee, ozone, damp earth..."
                        value={selectedLocation.smell || ''}
                        onChange={e => updateLocation(selectedLocation.id, { smell: e.target.value })}
                      />
                    </div>

                    <div className="sensory-card">
                      <div className="sensory-card-header">
                        <Thermometer size={15} color="#f59e0b" />
                        <span>Touch & Climate</span>
                      </div>
                      <textarea
                        className="sensory-textarea"
                        rows={3}
                        placeholder="Chilly draft, damp humid air, rough cobblestones underfoot, sticky counter tops..."
                        value={selectedLocation.touchWeather || ''}
                        onChange={e => updateLocation(selectedLocation.id, { touchWeather: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Points of Interest & Key Features */}
              {activeTab === 'features' && (
                <div className="dossier-section animate-fadeIn">
                  {/* Progress Meter */}
                  <div className="traits-meter-card">
                    <div className="meter-header">
                      <span className="meter-title">Points of Interest & Setting Milestones</span>
                      <span className="meter-stats">
                        {exploredFeatures} of {totalFeatures} explored ({featuresPercent}%)
                      </span>
                    </div>
                    <div className="meter-track">
                      <div
                        className="meter-fill"
                        style={{
                          width: `${featuresPercent}%`,
                          backgroundColor: selectedLocation.color || '#10b981',
                        }}
                      />
                    </div>
                  </div>

                  {/* Add Feature Form */}
                  <form onSubmit={handleAddFeatureSubmit} className="add-trait-bar">
                    <select
                      value={newFeatureCategory}
                      onChange={e => setNewFeatureCategory(e.target.value)}
                      className="trait-category-select"
                    >
                      {FEATURE_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Add a landmark, secret passageway, resource, or clue..."
                      value={newFeatureName}
                      onChange={e => setNewFeatureName(e.target.value)}
                      className="add-trait-input"
                    />

                    <button type="submit" className="btn btn-sm btn-primary add-trait-btn">
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </form>

                  {/* Features List */}
                  <div className="traits-checklist-grid">
                    {selectedLocation.features.length === 0 ? (
                      <div className="traits-empty-hint">
                        No points of interest added yet. Add landmarks, hidden rooms, clues, or resources above.
                      </div>
                    ) : (
                      selectedLocation.features.map(feat => (
                        <div
                          key={feat.id}
                          className={`trait-item-row ${feat.explored ? 'completed' : ''}`}
                        >
                          <button
                            type="button"
                            className="trait-toggle-check"
                            onClick={() => toggleLocationFeature(selectedLocation.id, feat.id)}
                            title={feat.explored ? 'Mark as unexplored' : 'Mark as explored in story'}
                          >
                            {feat.explored ? (
                              <CheckSquare size={17} color={selectedLocation.color || '#10b981'} />
                            ) : (
                              <Square size={17} color="var(--text-muted)" />
                            )}
                          </button>

                          <span className={`trait-tag tag-${feat.category || 'landmark'}`}>
                            {feat.category || 'feature'}
                          </span>

                          <span className="trait-label-text">{feat.name}</span>

                          <button
                            type="button"
                            className="trait-delete-btn"
                            onClick={() => removeLocationFeature(selectedLocation.id, feat.id)}
                            title="Remove feature"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Lore, Rules & Hazards */}
              {activeTab === 'lore' && (
                <div className="dossier-section animate-fadeIn">
                  <div className="form-group">
                    <label className="form-label">Narrative Significance & Plot Role</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Why does this location matter to the story arc? What pivotal scenes occur here?"
                      value={selectedLocation.significance || ''}
                      onChange={e => updateLocation(selectedLocation.id, { significance: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Local Rules, Hazards & World Mechanics</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      placeholder="Environmental hazards, supernatural laws, social taboos, security measures..."
                      value={selectedLocation.rulesHazards || ''}
                      onChange={e => updateLocation(selectedLocation.id, { rulesHazards: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Historical Lore, Origins & Architecture</label>
                    <textarea
                      className="form-textarea"
                      rows={5}
                      placeholder="Who built it? How old is it? What legendary battles or occurrences happened here in the past?"
                      value={selectedLocation.history || ''}
                      onChange={e => updateLocation(selectedLocation.id, { history: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Narrative Connections */}
              {activeTab === 'connections' && (
                <div className="dossier-section animate-fadeIn">
                  <div className="form-group">
                    <label className="form-label">Connected Characters Inhabiting or Visiting Here</label>
                    <p className="form-helper-text" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                      Click characters below to link them with this setting:
                    </p>

                    <div className="connections-tag-cloud">
                      {characters.length === 0 ? (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          No characters exist in manuscript yet.
                        </span>
                      ) : (
                        characters.map(char => {
                          const isLinked = selectedLocation.connectedCharacters?.includes(char.id);
                          return (
                            <button
                              key={char.id}
                              type="button"
                              className={`connection-pill ${isLinked ? 'linked' : ''}`}
                              onClick={() => handleToggleCharacterLink(char.id)}
                            >
                              <div
                                className="pill-dot"
                                style={{ backgroundColor: char.color || '#3b82f6' }}
                              />
                              <span>{char.name}</span>
                              {isLinked && <Check size={12} />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Story Footprint */}
              {activeTab === 'footprint' && (
                <div className="dossier-section animate-fadeIn">
                  <div className="footprint-overview-card">
                    <div className="footprint-stat">
                      <span className="stat-label">Chapters Featured</span>
                      <span className="stat-value">
                        {locationPresenceInfo ? locationPresenceInfo.chapters.length : '—'}
                      </span>
                    </div>

                    <div className="footprint-stat">
                      <span className="stat-label">Total Textual Mentions</span>
                      <span className="stat-value">
                        {locationPresenceInfo ? locationPresenceInfo.totalMentions : '—'}
                      </span>
                    </div>

                    <div className="footprint-actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setViewMode('cast-grid')}
                      >
                        <LayoutGrid size={14} />
                        <span>Open Presence Grid</span>
                      </button>

                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => runCastPresenceAnalysis(true)}
                      >
                        <span>Re-Scan Manuscript</span>
                      </button>
                    </div>
                  </div>

                  {locationPresenceInfo && locationPresenceInfo.chapters.length > 0 ? (
                    <div className="footprint-chapters-list">
                      <h4 className="footprint-subheading">Chapter Appearances</h4>
                      {locationPresenceInfo.chapters.map(ch => {
                        const pres = castPresenceData?.presenceMap[`${selectedLocation.id}::${ch.id}`];
                        return (
                          <div key={ch.id} className="footprint-chapter-row">
                            <div className="footprint-ch-info">
                              <span className="footprint-ch-title">{ch.title}</span>
                              <span className="footprint-ch-mentions">
                                {pres?.count || 0} {(pres?.count || 0) === 1 ? 'mention' : 'mentions'}
                              </span>
                            </div>

                            {pres?.occurrences?.[0] && (
                              <div className="footprint-sample-snippet">
                                "{pres.occurrences[0].snippet}"
                              </div>
                            )}

                            <button
                              className="btn btn-xs btn-ghost footprint-jump-btn"
                              onClick={() => {
                                setActiveChapterId(ch.id);
                                setViewMode('editor');
                              }}
                            >
                              <BookOpen size={12} />
                              <span>Open in Editor</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="footprint-empty-hint">
                      No chapter mentions found for "{selectedLocation.name}". Run the Presence Grid scanner
                      or check that the setting's name or aliases appear in the manuscript text.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: Author Notes */}
              {activeTab === 'notes' && (
                <div className="dossier-section animate-fadeIn">
                  <div className="form-group">
                    <label className="form-label">Freeform Worldbuilding Notes, Maps & Ideas</label>
                    <textarea
                      className="form-textarea"
                      rows={12}
                      placeholder="Jot down architectural sketches, historical timelines, floor plans, sensory inspiration..."
                      value={selectedLocation.notes || ''}
                      onChange={e => updateLocation(selectedLocation.id, { notes: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className="entity-detail-empty">
            <Compass size={38} color="var(--text-muted)" />
            <p>Select a location from the codex or create a new one to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};
