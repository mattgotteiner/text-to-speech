import { Drawer } from '@mattgotteiner/spa-ui-controls';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import type { AppSettings } from '../../types';

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
  return (
    <Drawer
      closeLabel="Close settings"
      description="Configure your Azure Speech resource, audio options, and appearance."
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      width={400}
    >
      <SettingsPanel
        onReset={onReset}
        onUpdate={onUpdate}
        settings={settings}
      />
    </Drawer>
  );
}
