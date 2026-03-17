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
  if (!isOpen) {
    return <></>;
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-sidebar">
        <div className="settings-sidebar__header">
          <h2 className="settings-sidebar__title">Settings</h2>
          <button
            className="settings-sidebar__close"
            type="button"
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
      </div>
    </div>
  );
}
