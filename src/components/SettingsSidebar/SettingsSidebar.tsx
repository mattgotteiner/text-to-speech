import { Drawer } from '@mattgotteiner/spa-ui-controls';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import type { AppSettings } from '../../types';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  onUpdate: (updates: Partial<AppSettings>) => void;
  persistenceMessage: string | null;
  settings: AppSettings;
}

export function SettingsSidebar({
  isOpen,
  onClose,
  onReset,
  onUpdate,
  persistenceMessage,
  settings,
}: SettingsSidebarProps): React.ReactElement {
  return (
    <Drawer closeLabel="Close settings" isOpen={isOpen} onClose={onClose} side="right" title="Settings" width={400}>
      <SettingsPanel
        onReset={onReset}
        onUpdate={onUpdate}
        persistenceMessage={persistenceMessage}
        settings={settings}
      />
    </Drawer>
  );
}
