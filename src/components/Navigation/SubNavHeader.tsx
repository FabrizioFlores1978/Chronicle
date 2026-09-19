import React from 'react';
import { useEpub } from '../../context/EpubContext';
import { AppViewMode } from '../../types/epub';
import {
  Edit3,
  BookOpen,
  Terminal,
  Clock,
  LayoutGrid,
  Users,
  Compass,
  Image as ImageIcon,
  Palette,
  ListOrdered,
  Tag,
  FolderArchive,
  Share2,
} from 'lucide-react';

export const SubNavHeader: React.FC = () => {
  const {
    book,
    primaryMode,
    viewMode,
    setViewMode,
    minimalistMode,
    isZenMode,
    characters,
    locations,
    timelines,
    totalWordCount,
    totalReadingTimeMinutes,
    setIsExportModalOpen,
    isCharacterSidebarOpen,
    setIsCharacterSidebarOpen,
    isLocationSidebarOpen,
    setIsLocationSidebarOpen,
  } = useEpub();

  if (isZenMode || minimalistMode || !book) {
    return null;
  }

  // 1. Write Canvas Items
  const writeCanvasItems: {
    id: AppViewMode;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    title: string;
  }[] = [
    {
      id: 'editor',
      label: 'Editor',
      icon: <Edit3 size={14} />,
      badge: totalWordCount > 0 ? `${totalWordCount.toLocaleString()} w` : undefined,
      title: 'Manuscript writing canvas & rich text editor',
    },
    {
      id: 'reader',
      label: 'Reader',
      icon: <BookOpen size={14} />,
      badge: `${totalReadingTimeMinutes}m read`,
      title: 'Distraction-free reader view with audio TTS queue playback',
    },
    {
      id: 'inspector',
      label: 'Inspect',
      icon: <Terminal size={14} />,
      title: 'Structural EPUB package validator, manifest explorer & raw files',
    },
  ];

  // 2. Knowledge Base Items
  const knowledgeBaseItems: {
    id: AppViewMode;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    title: string;
  }[] = [
    {
      id: 'cast-grid',
      label: 'Presence Grid',
      icon: <LayoutGrid size={14} />,
      badge: characters.length + locations.length > 0 ? characters.length + locations.length : undefined,
      title: 'Chapter cast presence and character occurrence matrix',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <Clock size={14} />,
      badge: timelines.length > 0 ? timelines.length : undefined,
      title: 'Story event timeline and chronology',
    },
    {
      id: 'characters',
      label: 'Characters',
      icon: <Users size={14} />,
      badge: characters.length > 0 ? characters.length : undefined,
      title: 'Character dossiers, traits, archetypes, and relationship maps',
    },
    {
      id: 'locations',
      label: 'Location codex',
      icon: <Compass size={14} />,
      badge: locations.length > 0 ? locations.length : undefined,
      title: 'Worldbuilding location codex, geography, and sensory notes',
    },
  ];

  // 3. Publish Items
  const publishItems: {
    id: AppViewMode;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    title: string;
  }[] = [
    {
      id: 'cover',
      label: 'Cover Studio',
      icon: <ImageIcon size={14} />,
      title: 'Vector book cover designer & layout studio',
    },
    {
      id: 'styles',
      label: 'Styles & CSS',
      icon: <Palette size={14} />,
      title: 'Book typography stylesheets and custom CSS editor',
    },
    {
      id: 'toc',
      label: 'Table of Contents',
      icon: <ListOrdered size={14} />,
      badge: book.chapters.length > 0 ? book.chapters.length : undefined,
      title: 'Hierarchical navigation and chapter ordering',
    },
    {
      id: 'metadata',
      label: 'Metadata',
      icon: <Tag size={14} />,
      title: 'Dublin Core metadata (title, author, ISBN, series, description)',
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: <FolderArchive size={14} />,
      badge: book.assets.length > 0 ? book.assets.length : undefined,
      title: 'Media assets, images, fonts, and illustrations',
    },
  ];

  const handleWriteItemClick = (id: AppViewMode) => {
    setIsCharacterSidebarOpen(false);
    setIsLocationSidebarOpen(false);
    setViewMode(id);
  };

  const handleKnowledgeBaseItemInWriteModeClick = (id: AppViewMode) => {
    if (id === 'characters') {
      if (viewMode !== 'editor') {
        setViewMode('editor');
      }
      setIsLocationSidebarOpen(false);
      setIsCharacterSidebarOpen(prev => !prev);
    } else if (id === 'locations') {
      if (viewMode !== 'editor') {
        setViewMode('editor');
      }
      setIsCharacterSidebarOpen(false);
      setIsLocationSidebarOpen(prev => !prev);
    } else {
      setIsCharacterSidebarOpen(false);
      setIsLocationSidebarOpen(false);
      setViewMode(id);
    }
  };

  return (
    <div className="sub-nav-header" role="navigation" aria-label="Contextual workspace navigation">
      {primaryMode === 'write' ? (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Left: Writing Canvas Tools */}
          <div className="sub-nav-tabs">
            {writeCanvasItems.map(item => {
              const isActive = viewMode === item.id;
              return (
                <button
                  key={item.id}
                  className={`sub-nav-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleWriteItemClick(item.id)}
                  title={item.title}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`sub-nav-badge ${isActive ? 'badge-active' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Knowledge Base Tools (Drawers in Writing mode, full tools on click) */}
          <div className="sub-nav-tabs">
            {knowledgeBaseItems.map(item => {
              let isActive = false;
              if (item.id === 'characters') {
                isActive = isCharacterSidebarOpen && viewMode === 'editor';
              } else if (item.id === 'locations') {
                isActive = isLocationSidebarOpen && viewMode === 'editor';
              } else {
                isActive = viewMode === item.id;
              }

              const dynamicTitle =
                item.id === 'characters'
                  ? (isCharacterSidebarOpen ? 'Close Character Dossiers sidebar drawer' : 'Open Character Dossiers sidebar drawer')
                  : item.id === 'locations'
                  ? (isLocationSidebarOpen ? 'Close Location Codex sidebar drawer' : 'Open Location Codex sidebar drawer')
                  : item.title;

              return (
                <button
                  key={item.id}
                  className={`sub-nav-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleKnowledgeBaseItemInWriteModeClick(item.id)}
                  title={dynamicTitle}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`sub-nav-badge ${isActive ? 'badge-active' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : primaryMode === 'knowledge-base' ? (
        <div className="sub-nav-tabs">
          {knowledgeBaseItems.map(item => {
            const isActive = viewMode === item.id;
            return (
              <button
                key={item.id}
                className={`sub-nav-pill ${isActive ? 'active' : ''}`}
                onClick={() => setViewMode(item.id)}
                title={item.title}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`sub-nav-badge ${isActive ? 'badge-active' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="sub-nav-tabs">
            {publishItems.map(item => {
              const isActive = viewMode === item.id;
              return (
                <button
                  key={item.id}
                  className={`sub-nav-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setViewMode(item.id)}
                  title={item.title}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`sub-nav-badge ${isActive ? 'badge-active' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            className="btn btn-sm btn-primary sub-nav-export-btn"
            onClick={() => setIsExportModalOpen(true)}
            title="Open Master Export Hub (EPUB, PDF, DOCX, Shunn, TXT, HTML)"
          >
            <Share2 size={13} />
            <span>Export Hub...</span>
          </button>
        </>
      )}
    </div>
  );
};
