declare module '@mattgotteiner/spa-ui-controls' {
  import type * as React from 'react';

  export type ThemeMode = 'light' | 'dark' | 'system';
  export type ResolvedTheme = Exclude<ThemeMode, 'system'>;

  export interface ThemeContextValue {
    theme: ThemeMode;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: ThemeMode) => void;
  }

  export interface AppShellProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    className?: string;
    contentClassName?: string;
  }

  export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
    actions?: React.ReactNode;
    heading?: React.ReactNode;
    tone?: 'info' | 'success' | 'warning' | 'danger';
  }

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md';
    fullWidth?: boolean;
  }

  export interface DrawerProps {
    children: React.ReactNode;
    closeLabel?: string;
    description?: React.ReactNode;
    footer?: React.ReactNode;
    isOpen: boolean;
    onClose?: () => void;
    side?: 'left' | 'right';
    title?: React.ReactNode;
    width?: number | string;
  }

  export interface FormFieldProps {
    children: React.ReactNode;
    error?: React.ReactNode;
    hint?: React.ReactNode;
    htmlFor?: string;
    label?: React.ReactNode;
    className?: string;
  }

  export interface IconButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    label: string;
  }

  export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
    as?: 'article' | 'div' | 'section';
  }

  export interface ThemeProviderProps {
    children: React.ReactNode;
    initialTheme?: ThemeMode;
    persist?: boolean;
    storageKey?: string;
  }

  export interface ThemeToggleProps {
    className?: string;
    onChange: (theme: ThemeMode) => void;
    value: ThemeMode;
  }

  export interface TopBarProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
    className?: string;
  }

  export const THEME_OPTIONS: ThemeMode[];

  export function AppShell(props: AppShellProps): React.ReactElement;
  export function Banner(props: BannerProps): React.ReactElement;
  export function Button(props: ButtonProps): React.ReactElement;
  export function Drawer(props: DrawerProps): React.ReactElement | null;
  export function FormField(props: FormFieldProps): React.ReactElement;
  export function IconButton(props: IconButtonProps): React.ReactElement;
  export function Panel(props: PanelProps): React.ReactElement;
  export function ThemeProvider(props: ThemeProviderProps): React.ReactElement;
  export function ThemeToggle(props: ThemeToggleProps): React.ReactElement;
  export function TopBar(props: TopBarProps): React.ReactElement;
  export function useTheme(): ThemeContextValue;
}
