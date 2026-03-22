import { useEffect } from 'react';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import type { AppSettings } from '../../types';
import './SettingsSidebar.css';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  onUpdate: (updates: Partial<AppSettings>) => void;
  settings: AppSettings;
}

export function SettingsSidebar({
  isOpen,
  onClose,
  onReset,
  onUpdate,
  settings,
}: SettingsSidebarProps): React.ReactElement {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return <></>;
  }

  return (
    <div
      className="settings-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        aria-labelledby="settings-sidebar-title"
        aria-modal="true"
        className="settings-sidebar"
        role="dialog"
      >
        <div className="settings-sidebar__header">
          <h2 id="settings-sidebar-title" className="settings-sidebar__title">
            Settings
          </h2>
          <button
            type="button"
            className="settings-sidebar__close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="settings-sidebar__content">
          <SettingsPanel
            onReset={onReset}
            onUpdate={onUpdate}
            settings={settings}
          />
        </div>
      </aside>
    </div>
  );
}
