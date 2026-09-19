import React, { useState, useEffect } from 'react';
import { useEpub } from '../../context/EpubContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { UI_THEMES } from '../../types/theme';
import { testConnection, isTauri } from '../../services/cloud/webdavClient';
import { WebDavConfig } from '../../types/cloud';
import { saveSetting } from '../../services/storage/indexedDbSettings';
import {
  Settings,
  X,
  Palette,
  Cloud,
  Sliders,
  Database,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Server,
  User,
  KeyRound,
  FolderTree,
  Eye,
  EyeOff,
  Trash2,
  HelpCircle,
  Moon,
  Sun,
  Sparkles,
  Keyboard,
  Feather,
  Layout,
  Focus,
  MoveVertical,
  MessageSquareOff,
} from 'lucide-react';

export type SettingsTab = 'appearance' | 'themes' | 'cloud' | 'editor' | 'general';

interface SettingsModalProps {
  initialTab?: SettingsTab;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  initialTab = 'appearance',
  onClose,
}) => {
  const {
    uiTheme,
    setUiTheme,
    minimalistMode,
    setMinimalistMode,
    isZenMode,
    toggleZenMode,
    zenSettings,
    updateZenSettings,
    webdavConfig,
    isWebDavConnected,
    updateWebDavConfig,
    showNotification,
    readerTheme,
    setReaderTheme,
    readerFont,
    setReaderFont,
    readerMarginWidth,
    setReaderMarginWidth,
    setIsWelcomeModalOpen,
  } = useEpub();

  useEscapeKey(onClose);

  const isDesktop = isTauri();
  const effectiveInitialTab = (!isDesktop && initialTab === 'cloud') ? 'appearance' : initialTab;
  const [activeTab, setActiveTab] = useState<SettingsTab>(effectiveInitialTab);

  useEffect(() => {
    if (!isDesktop && initialTab === 'cloud') {
      setActiveTab('appearance');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isDesktop]);

  // Cloud WebDAV Form State
  const [serverUrl, setServerUrl] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [remotePath, setRemotePath] = useState<string>('/Chronicle/');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [showCloudHelp, setShowCloudHelp] = useState<boolean>(false);

  // General Preferences State
  const [showWelcomeOnStartup, setShowWelcomeOnStartup] = useState<boolean>(true);

  // Initialize WebDAV and general states
  useEffect(() => {
    if (webdavConfig) {
      setServerUrl(webdavConfig.serverUrl || '');
      setUsername(webdavConfig.username || '');
      setPassword(webdavConfig.password || '');
      setRemotePath(webdavConfig.remotePath || '/Chronicle/');
    }
  }, [webdavConfig]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('chronicle_show_welcome_on_startup');
      if (saved !== null) {
        setShowWelcomeOnStartup(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleWelcome = async (checked: boolean) => {
    setShowWelcomeOnStartup(checked);
    await saveSetting('showWelcomeOnStartup', checked);
    try {
      localStorage.setItem('chronicle_show_welcome_on_startup', String(checked));
    } catch {
      // ignore
    }
    showNotification('info', checked ? 'Welcome guide will show on startup.' : 'Welcome guide disabled on startup.');
  };

  const handleTestCloudConnection = async () => {
    if (!serverUrl.trim() || !username.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter both Server URL and Username.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const configToTest: WebDavConfig = {
        serverUrl: serverUrl.trim(),
        username: username.trim(),
        password: password,
        remotePath: remotePath.trim() || '/Chronicle/',
      };

      const result = await testConnection(configToTest);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCloudConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serverUrl.trim() || !username.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter both Server URL and Username.',
      });
      return;
    }

    setIsSavingCloud(true);
    try {
      const newConfig: WebDavConfig = {
        serverUrl: serverUrl.trim(),
        username: username.trim(),
        password: password,
        remotePath: remotePath.trim() || '/Chronicle/',
        connected: true,
      };

      await updateWebDavConfig(newConfig);
      showNotification('success', 'WebDAV configuration saved to IndexedDB!');
      setTestResult({
        success: true,
        message: 'Configuration saved and connection active.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to save configuration.',
      });
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleDisconnectCloud = async () => {
    if (window.confirm('Disconnect and remove stored WebDAV cloud credentials?')) {
      await updateWebDavConfig(null);
      setServerUrl('');
      setUsername('');
      setPassword('');
      setRemotePath('/Chronicle/');
      setTestResult(null);
      showNotification('info', 'WebDAV configuration removed from IndexedDB.');
    }
  };

  const allNavTabs: { id: SettingsTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Layout size={16} /> },
    { id: 'themes', label: 'Themes', icon: <Palette size={16} /> },
    {
      id: 'cloud',
      label: 'Cloud Storage',
      icon: <Cloud size={16} />,
      badge: isWebDavConnected ? 'Active' : undefined,
    },
    { id: 'editor', label: 'Editor & Reading', icon: <Sliders size={16} /> },
    { id: 'general', label: 'General & Storage', icon: <Database size={16} /> },
  ];

  const navTabs = isDesktop ? allNavTabs : allNavTabs.filter(tab => tab.id !== 'cloud');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 280 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '1060px',
          width: '94vw',
          height: 'min(760px, 88vh)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '1.1rem 1.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                background: 'rgba(124, 58, 237, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Settings size={18} />
            </div>
            <div>
              <h3 id="settings-dialog-title" className="modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                Settings & Preferences
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                All settings are stored in local browser IndexedDB and automatically restored on startup
              </p>
            </div>
          </div>
          <button className="btn-icon btn-sm" onClick={onClose} title="Close Settings (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: Sidebar + Main Workspace */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Navigation Sidebar */}
          <div
            style={{
              width: '225px',
              backgroundColor: 'var(--bg-sidebar)',
              borderRight: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              padding: '0.9rem 0.65rem',
              gap: '0.25rem',
              flexShrink: 0,
            }}
          >
            {navTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div style={{ marginTop: 'auto', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  onClose();
                  setIsWelcomeModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  fontSize: '0.78rem',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  justifyContent: 'flex-start',
                  width: '100%',
                }}
                title="Open Chronicle Welcome & Quick Start Guide"
              >
                <Sparkles size={15} style={{ color: '#c084fc' }} />
                <span>Guide & Overview</span>
              </button>

              <div style={{ padding: '0 0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <div>Chronicle Studio</div>
                <div style={{ opacity: 0.8 }}>v1.2.0</div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.3rem',
              backgroundColor: 'var(--bg-app)',
            }}
          >
            {/* ---------------- Tab 1: Appearance ---------------- */}
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                {/* 1. Workspace Interface Mode Switcher */}
                <div>
                  <div style={{ marginBottom: '0.85rem' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Workspace Interface Mode
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Choose between the full authoring studio suite or a distraction-free minimalist writing environment.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.9rem' }}>
                    {/* Option 1: Studio Mode */}
                    <div
                      onClick={() => setMinimalistMode(false)}
                      style={{
                        borderRadius: '12px',
                        border: !minimalistMode
                          ? '2px solid var(--accent-primary)'
                          : '1px solid var(--border-medium)',
                        backgroundColor: !minimalistMode ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        boxShadow: !minimalistMode ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                        cursor: 'pointer',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '8px',
                              backgroundColor: !minimalistMode ? 'var(--accent-primary-glow)' : 'var(--bg-surface-hover)',
                              color: !minimalistMode ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Layout size={17} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                              Studio Mode
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              Full Authoring Suite
                            </div>
                          </div>
                        </div>

                        {!minimalistMode && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(124, 58, 237, 0.14)',
                              color: 'var(--accent-primary)',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                            }}
                          >
                            <Check size={11} /> Active
                          </span>
                        )}
                      </div>

                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        Complete multi-pane workspace with top view navigation, utility sidebars, casting tools, and status telemetry.
                      </p>
                    </div>

                    {/* Option 2: Minimalist Mode */}
                    <div
                      onClick={() => setMinimalistMode(true)}
                      style={{
                        borderRadius: '12px',
                        border: minimalistMode
                          ? '2px solid var(--accent-primary)'
                          : '1px solid var(--border-medium)',
                        backgroundColor: minimalistMode ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        boxShadow: minimalistMode ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                        cursor: 'pointer',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '8px',
                              backgroundColor: minimalistMode ? 'var(--accent-primary-glow)' : 'var(--bg-surface-hover)',
                              color: minimalistMode ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Feather size={17} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                              Minimalist Mode
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              Distraction-Free Canvas
                            </div>
                          </div>
                        </div>

                        {minimalistMode && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(124, 58, 237, 0.14)',
                              color: 'var(--accent-primary)',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                            }}
                          >
                            <Check size={11} /> Active
                          </span>
                        )}
                      </div>

                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        Conceals secondary toolbars, status bars, and studio panels to keep you in pure creative flow. Toggle with <kbd className="kbd-shortcut" style={{ fontSize: '0.7rem' }}>Alt+M</kbd>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Zen Mode (Distraction-Free Immersion) */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Zen Mode (Distraction-Free Immersion)
                        </h4>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: isZenMode ? 'rgba(124, 58, 237, 0.2)' : 'var(--bg-surface-elevated)',
                            color: isZenMode ? 'var(--accent-primary)' : 'var(--text-muted)',
                            border: `1px solid ${isZenMode ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          }}
                        >
                          {isZenMode ? 'Active Now' : 'Inactive'}
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Deep-work writing environment with centered typewriter viewport, dimmed inactive paragraphs, and zero UI chrome.
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`btn btn-sm ${isZenMode ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={toggleZenMode}
                      style={{ fontSize: '0.78rem', gap: '5px' }}
                    >
                      <Focus size={14} />
                      <span>{isZenMode ? 'Exit Zen Mode (Esc)' : 'Enter Zen Mode (Alt+Z)'}</span>
                    </button>
                  </div>

                  {/* Auto-Switch On Typing Toggle */}
                  <div
                    style={{
                      padding: '0.85rem 1.1rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.85rem',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        Switch to Zen Mode on typing
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Automatically transitions the workspace into Zen mode the moment you begin typing in the manuscript.
                      </div>
                    </div>
                    <label className="toggle-switch" style={{ margin: 0, flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={zenSettings.autoSwitchOnTyping}
                        onChange={e => updateZenSettings({ autoSwitchOnTyping: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  {/* The 4 Core Zen Mechanics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                    {/* Mechanic 1: Typewriter Scrolling */}
                    <div
                      onClick={() => updateZenSettings({ typewriterScrolling: !zenSettings.typewriterScrolling })}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: zenSettings.typewriterScrolling ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        border: zenSettings.typewriterScrolling ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          <MoveVertical size={16} color="var(--accent-primary)" />
                          Typewriter Scrolling
                        </div>
                        <input
                          type="checkbox"
                          checked={zenSettings.typewriterScrolling}
                          onChange={e => e.stopPropagation()}
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        Keeps the currently active paragraph locked at vertical eye-level while you type, preventing neck fatigue.
                      </p>
                    </div>

                    {/* Mechanic 2: Focus Dimming */}
                    <div
                      onClick={() => updateZenSettings({ focusDimming: !zenSettings.focusDimming })}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: zenSettings.focusDimming ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        border: zenSettings.focusDimming ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          <Focus size={16} color="var(--accent-primary)" />
                          Focus Dimming
                        </div>
                        <input
                          type="checkbox"
                          checked={zenSettings.focusDimming}
                          onChange={e => e.stopPropagation()}
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        Fades surrounding paragraphs to 35% opacity, brightly spotlighting only your active sentence and thought.
                      </p>
                    </div>

                    {/* Mechanic 3: Ghost HUD (Zero UI) */}
                    <div
                      onClick={() => updateZenSettings({ ghostHud: !zenSettings.ghostHud })}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: zenSettings.ghostHud ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        border: zenSettings.ghostHud ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          <EyeOff size={16} color="var(--accent-primary)" />
                          Ghost HUD (Zero UI)
                        </div>
                        <input
                          type="checkbox"
                          checked={zenSettings.ghostHud}
                          onChange={e => e.stopPropagation()}
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        Hides all toolbars and borders. Moving the mouse reveals faint Ghost Bar with chapter, words, and Exit (Esc).
                      </p>
                    </div>

                    {/* Mechanic 4: Hide Comments & Highlights */}
                    <div
                      onClick={() => updateZenSettings({ hideComments: !zenSettings.hideComments })}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: zenSettings.hideComments ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        border: zenSettings.hideComments ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          <MessageSquareOff size={16} color="var(--accent-primary)" />
                          Hide Comments
                        </div>
                        <input
                          type="checkbox"
                          checked={zenSettings.hideComments}
                          onChange={e => e.stopPropagation()}
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        Conceals margin notes and in-text comment highlights while in Zen mode for clean, distraction-free writing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Focus Shortcuts Reference Footer */}
                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Keyboard size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Focus Shortcuts:</strong> Press <kbd className="kbd-shortcut" style={{ fontSize: '0.72rem' }}>Alt+M</kbd> anywhere to quickly toggle Minimalist Mode, or <kbd className="kbd-shortcut" style={{ fontSize: '0.72rem' }}>Alt+Z</kbd> to enter full distraction-free Zen Mode. Press <kbd className="kbd-shortcut" style={{ fontSize: '0.72rem' }}>Esc</kbd> to exit.
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- Tab 2: Themes ---------------- */}
            {activeTab === 'themes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Application UI Themes
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Switch the visual atmosphere across all studio headers, sidebars, cards, modals, and workspace chrome.
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(124, 58, 237, 0.12)',
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(124, 58, 237, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    Active: {UI_THEMES.find(t => t.id === uiTheme)?.name || 'Classic - Dark'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {UI_THEMES.map(theme => {
                    const isSelected = uiTheme === theme.id;

                    return (
                      <div
                        key={theme.id}
                        onClick={() => setUiTheme(theme.id)}
                        style={{
                          borderRadius: '12px',
                          border: isSelected
                            ? '2px solid var(--accent-primary)'
                            : '1px solid var(--border-medium)',
                          backgroundColor: 'var(--bg-surface)',
                          boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                          cursor: 'pointer',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          position: 'relative',
                        }}
                      >
                        {/* Preview Mockup Card */}
                        <div
                          style={{
                            height: '115px',
                            borderRadius: '8px',
                            backgroundColor: theme.bgPreview,
                            border: `1px solid ${theme.borderPreview}`,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        >
                          {/* Mini Header */}
                          <div
                            style={{
                              height: '26px',
                              backgroundColor: theme.surfacePreview,
                              borderBottom: `1px solid ${theme.borderPreview}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0 10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: theme.accent }} />
                              <div style={{ width: 40, height: 5, borderRadius: 2, backgroundColor: theme.textColor, opacity: 0.6 }} />
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <div style={{ width: 16, height: 6, borderRadius: 2, backgroundColor: theme.accent }} />
                              <div style={{ width: 16, height: 6, borderRadius: 2, backgroundColor: theme.textColor, opacity: 0.2 }} />
                            </div>
                          </div>

                          {/* Mini Workspace */}
                          <div style={{ flex: 1, display: 'flex', padding: '8px', gap: '8px' }}>
                            {/* Mini Sidebar */}
                            <div style={{ width: '44px', borderRadius: '4px', backgroundColor: theme.surfacePreview, border: `1px solid ${theme.borderPreview}`, padding: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ width: '100%', height: 5, borderRadius: 2, backgroundColor: theme.accent, opacity: 0.8 }} />
                              <div style={{ width: '75%', height: 4, borderRadius: 2, backgroundColor: theme.textColor, opacity: 0.25 }} />
                              <div style={{ width: '60%', height: 4, borderRadius: 2, backgroundColor: theme.textColor, opacity: 0.25 }} />
                            </div>
                            {/* Mini Page */}
                            <div style={{ flex: 1, borderRadius: '4px', backgroundColor: theme.surfacePreview, border: `1px solid ${theme.borderPreview}`, padding: '7px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ width: '45%', height: 6, borderRadius: 2, backgroundColor: theme.textColor, opacity: 0.8 }} />
                              <div style={{ width: '92%', height: 4, borderRadius: 2, backgroundColor: theme.textColor, opacity: 0.3 }} />
                              <div style={{ width: '82%', height: 4, borderRadius: 2, backgroundColor: theme.textColor, opacity: 0.3 }} />
                              <div style={{ width: '88%', height: 4, borderRadius: 2, backgroundColor: theme.textColor, opacity: 0.3 }} />
                            </div>
                          </div>
                        </div>

                        {/* Title & Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {theme.id.includes('dark') ? (
                              <Moon size={16} color={theme.accent} />
                            ) : (
                              <Sun size={16} color={theme.accent} />
                            )}
                            <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                              {theme.name}
                            </span>
                          </div>

                          {isSelected && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                                color: 'var(--accent-primary)',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                              }}
                            >
                              <Check size={11} /> Active
                            </span>
                          )}
                        </div>

                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                          {theme.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Manuscript Canvas Paper Tone Integration */}
                <div
                  style={{
                    padding: '1.15rem 1.3rem',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        Default Manuscript Canvas Paper Tone
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Set the default paper background for your manuscript editor and reading canvas.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {(['light', 'sepia', 'dark', 'obsidian'] as const).map(t => {
                        const isToneActive = readerTheme === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            className={`btn btn-sm ${isToneActive ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setReaderTheme(t)}
                            style={{
                              textTransform: 'capitalize',
                              fontSize: '0.8rem',
                              padding: '0.35rem 0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span
                              style={{
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                backgroundColor:
                                  t === 'light'
                                    ? '#f8fafc'
                                    : t === 'sepia'
                                      ? '#fbf0d9'
                                      : t === 'dark'
                                        ? '#1e293b'
                                        : '#09090b',
                                border: '1px solid rgba(128,128,128,0.4)',
                              }}
                            />
                            {t}
                            {isToneActive && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Information Callout */}
                <div
                  style={{
                    padding: '0.95rem 1.1rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  <Sparkles size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Studio Chrome vs Manuscript Paper:</strong> Chronicle completely decouples your application chrome theme from your writing canvas paper tone. You can compose in a sleek, focused dark or cyberpunk studio while keeping your manuscript on warm sepia or high-contrast crisp white paper.
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- Tab 3: Cloud Storage (WebDAV - Tauri App Only) ---------------- */}
            {activeTab === 'cloud' && isDesktop && (
              <div>
                <div style={{ marginBottom: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      WebDAV Cloud Storage Configuration
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Sync manuscripts seamlessly with Nextcloud, ownCloud, Fastmail, or any standard WebDAV cloud server.
                    </p>
                  </div>
                  {isWebDavConnected && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={handleDisconnectCloud}
                      style={{ color: 'var(--accent-danger)', gap: '4px', fontSize: '0.78rem' }}
                      title="Remove WebDAV configuration"
                    >
                      <Trash2 size={13} />
                      <span>Disconnect</span>
                    </button>
                  )}
                </div>

                {/* Connection Status Badge */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: isWebDavConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: `1px solid ${isWebDavConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.2rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        backgroundColor: isWebDavConnected ? '#10b981' : '#f59e0b',
                        boxShadow: `0 0 8px ${isWebDavConnected ? '#10b981' : '#f59e0b'}`,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: isWebDavConnected ? '#10b981' : '#d97706' }}>
                        {isWebDavConnected ? 'WebDAV Cloud Connected & Synchronized' : 'WebDAV Not Configured'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {isWebDavConnected && webdavConfig
                          ? `${webdavConfig.serverUrl} (${webdavConfig.remotePath || '/'})`
                          : 'Enter your server details below and click Save.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Form */}
                <form onSubmit={handleSaveCloudConfig} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                      <Server size={13} color="var(--accent-primary)" />
                      <span>WebDAV Server Endpoint URL:</span>
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      value={serverUrl}
                      onChange={e => setServerUrl(e.target.value)}
                      placeholder="https://cloud.example.com/remote.php/dav/files/username/"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                        <User size={13} color="var(--accent-primary)" />
                        <span>Username:</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="your-username"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                        <KeyRound size={13} color="var(--accent-primary)" />
                        <span>Password or App Token:</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-input"
                          style={{ paddingRight: '2.4rem' }}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••••••••••"
                        />
                        <button
                          type="button"
                          className="btn-icon btn-sm"
                          style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }}
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                      <FolderTree size={13} color="var(--accent-primary)" />
                      <span>Remote Folder Path:</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={remotePath}
                      onChange={e => setRemotePath(e.target.value)}
                      placeholder="/Chronicle/"
                    />
                  </div>

                  {/* Test Result Message */}
                  {testResult && (
                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        fontSize: '0.78rem',
                        color: testResult.success ? '#10b981' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {testResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowCloudHelp(!showCloudHelp)}
                      style={{ gap: '4px', fontSize: '0.76rem' }}
                    >
                      <HelpCircle size={13} />
                      <span>{showCloudHelp ? 'Hide Setup Tips' : 'Provider Tips (Nextcloud, etc.)'}</span>
                    </button>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleTestCloudConnection}
                        disabled={isTesting || !serverUrl.trim()}
                      >
                        {isTesting ? <Loader2 size={13} className="animate-spin" /> : <Server size={13} />}
                        <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                      </button>

                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={isSavingCloud || !serverUrl.trim()}
                      >
                        {isSavingCloud ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        <span>Save Cloud Settings</span>
                      </button>
                    </div>
                  </div>

                  {/* Setup Help Collapse */}
                  {showCloudHelp && (
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.76rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        Endpoint URL Cheat Sheet:
                      </div>
                      <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                        <li><strong>Nextcloud / ownCloud:</strong> <code>https://your-cloud.com/remote.php/dav/files/YOUR_USERNAME/</code></li>
                        <li><strong>Fastmail WebDAV:</strong> <code>https://myfiles.fastmail.com/</code></li>
                        <li><strong>Infomaniak kDrive:</strong> <code>https://kdrive.infomaniak.com/kdrive/YOUR_DRIVE_ID/</code></li>
                      </ul>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* ---------------- Tab 4: Editor & Reading Defaults ---------------- */}
            {activeTab === 'editor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Reading & Writing Preferences
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Set default typography, page width, and reading tone across the studio.
                  </p>
                </div>

                {/* Default Reading Tone */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Default Reading Paper Tone:</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    {(['light', 'sepia', 'dark', 'obsidian'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`btn btn-sm ${readerTheme === t ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setReaderTheme(t)}
                        style={{ textTransform: 'capitalize', fontSize: '0.78rem' }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Font Family */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Default Reader Font Family:</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    {(['serif', 'sans', 'literata', 'opendyslexic', 'mono'] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        className={`btn btn-sm ${readerFont === f ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setReaderFont(f)}
                        style={{ textTransform: 'capitalize', fontSize: '0.78rem' }}
                      >
                        {f === 'serif' ? 'Serif (Merriweather)' : f === 'sans' ? 'Sans (Inter)' : f === 'literata' ? 'Literata' : f === 'opendyslexic' ? 'OpenDyslexic' : 'Monospace'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Width Slider */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                      Editor / Reader Margin Width:
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {readerMarginWidth}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={560}
                    max={1080}
                    step={20}
                    value={readerMarginWidth}
                    onChange={e => setReaderMarginWidth(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Narrow (560px)</span>
                    <span>Standard (760px)</span>
                    <span>Widescreen (1080px)</span>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- Tab 5: General & Storage ---------------- */}
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    General & Local Storage Diagnostics
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    System startup preferences and browser database status.
                  </p>
                </div>

                {/* User & Welcome Guide Launch Card */}
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} style={{ color: '#c084fc' }} />
                      <span>Welcome & Feature Guide</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Feature overview, writing tools guide, worldbuilding dossiers, and publishing walkthrough.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onClose();
                      setIsWelcomeModalOpen(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <Sparkles size={13} style={{ color: '#c084fc' }} />
                    <span>Open Guide</span>
                  </button>
                </div>

                {/* Startup Welcome Guide Toggle */}
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      Show Welcome Guide on Startup
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Presents the introductory feature overview and quick-open actions when Chronicle boots.
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={showWelcomeOnStartup}
                    onChange={e => handleToggleWelcome(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                </div>

                {/* IndexedDB Status Card */}
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                    <Database size={16} color="var(--accent-primary)" />
                    <span>IndexedDB Persistence Engine</span>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Chronicle uses a local browser IndexedDB database (<code>chronicle_app_settings_db</code>) to preserve:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <div>✓ Active UI Theme (ModernX / Glass)</div>
                    {isDesktop && <div>✓ WebDAV Cloud Sync Credentials</div>}
                    <div>✓ Startup Guide Preference</div>
                    <div>✓ Reader & Writer Layout Defaults</div>
                  </div>
                </div>

                {/* Essential Shortcuts Reference */}
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                    <Keyboard size={15} color="var(--accent-primary)" />
                    <span>Global Desktop Keybindings</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 6px', borderRadius: 4, backgroundColor: 'var(--bg-input)' }}>
                      <span>Settings & Preferences</span>
                      <kbd className="kbd-shortcut">Ctrl+,</kbd>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 6px', borderRadius: 4, backgroundColor: 'var(--bg-input)' }}>
                      <span>{isDesktop ? 'Quick Save (Local / Cloud)' : 'Quick Save (Project File)'}</span>
                      <kbd className="kbd-shortcut">Ctrl+S</kbd>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 6px', borderRadius: 4, backgroundColor: 'var(--bg-input)' }}>
                      <span>Open File / Manuscript</span>
                      <kbd className="kbd-shortcut">Ctrl+O</kbd>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 6px', borderRadius: 4, backgroundColor: 'var(--bg-input)' }}>
                      <span>Toggle Chapters Sidebar</span>
                      <kbd className="kbd-shortcut">Ctrl+\</kbd>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 6px', borderRadius: 4, backgroundColor: 'var(--bg-input)' }}>
                      <span>Toggle Minimalist / Studio Mode</span>
                      <kbd className="kbd-shortcut">Alt+M</kbd>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 6px', borderRadius: 4, backgroundColor: 'var(--bg-input)' }}>
                      <span>Toggle Zen Mode</span>
                      <kbd className="kbd-shortcut">Alt+Z</kbd>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 6px', borderRadius: 4, backgroundColor: 'var(--bg-input)' }}>
                      <span>Exit Zen Mode</span>
                      <kbd className="kbd-shortcut">Esc</kbd>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
