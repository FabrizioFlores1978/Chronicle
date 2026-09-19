import React, { useState } from 'react';
import { useEpub } from '../../context/EpubContext';
import { WysiwygEditor } from './WysiwygEditor';
import { CharacterSheetPanel } from '../Characters/CharacterSheetPanel';
import { CharacterDetailModal } from '../Characters/CharacterDetailModal';
import { LocationCodexPanel } from '../Locations/LocationCodexPanel';
import { LocationDetailModal } from '../Locations/LocationDetailModal';

export const EditorContainer: React.FC = () => {
  const {
    bookSessionId,
    activeChapter,
    isCharacterSidebarOpen,
    setIsCharacterSidebarOpen,
    isLocationSidebarOpen,
    setIsLocationSidebarOpen,
  } = useEpub();

  const [modalCharacterId, setModalCharacterId] = useState<string | null>(null);
  const [modalLocationId, setModalLocationId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Main WYSIWYG Writing Canvas */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <WysiwygEditor key={`${bookSessionId}_${activeChapter?.id || 'none'}`} />
        </div>

        {/* Character Sheet Sidebar Drawer */}
        {isCharacterSidebarOpen && (
          <CharacterSheetPanel
            onExpandModal={id => setModalCharacterId(id)}
            onClose={() => setIsCharacterSidebarOpen(false)}
          />
        )}

        {/* Location Codex Sidebar Drawer */}
        {isLocationSidebarOpen && (
          <LocationCodexPanel
            onExpandModal={id => setModalLocationId(id)}
            onClose={() => setIsLocationSidebarOpen(false)}
          />
        )}
      </div>

      {/* Deep-Dive Modals */}
      <CharacterDetailModal
        characterId={modalCharacterId}
        isOpen={!!modalCharacterId}
        onClose={() => setModalCharacterId(null)}
      />
      <LocationDetailModal
        locationId={modalLocationId}
        isOpen={!!modalLocationId}
        onClose={() => setModalLocationId(null)}
      />
    </div>
  );
};
