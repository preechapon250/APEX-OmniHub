/**
 * Zero-Dependency Type-Safe I18N Engine
 * React Store implementation for multi-language support
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Supported locales
export const LOCALES = ['en', 'es', 'de', 'ja', 'fr', 'pt', 'it'] as const;
export type Locale = typeof LOCALES[number];

// Language names mapping
const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  ja: '日本語',
  fr: 'Français',
  pt: 'Português',
  it: 'Italiano',
};

// Dictionary type for type safety
export interface I18nDictionary {
  [key: string]: string | I18nDictionary;
}

// Base dictionaries with fallback support
const DICTIONARIES: Record<Locale, I18nDictionary> = {
  en: {
    // Voice interface
    voice: {
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      processing: 'Processing...',
      listening: 'Listening...',
      error: 'Voice Error',
      permissionDenied: 'Microphone permission denied',
      notSupported: 'Voice input not supported',
      language: 'Language',
    },
    // Common UI
    common: {
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    // Navigation
    nav: {
      home: 'Home',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
    },
  },
  es: {
    voice: {
      startRecording: 'Iniciar Grabación',
      stopRecording: 'Detener Grabación',
      processing: 'Procesando...',
      listening: 'Escuchando...',
      error: 'Error de Voz',
      permissionDenied: 'Permiso de micrófono denegado',
      notSupported: 'Entrada de voz no soportada',
      language: 'Idioma',
    },
    common: {
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      delete: 'Eliminar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
    },
    nav: {
      home: 'Inicio',
      settings: 'Configuración',
      profile: 'Perfil',
      logout: 'Cerrar Sesión',
    },
  },
  de: {
    voice: {
      startRecording: 'Aufnahme starten',
      stopRecording: 'Aufnahme stoppen',
      processing: 'Verarbeitung...',
      listening: 'Zuhören...',
      error: 'Sprachfehler',
      permissionDenied: 'Mikrofonberechtigung verweigert',
      notSupported: 'Spracheingabe nicht unterstützt',
      language: 'Sprache',
    },
    common: {
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      save: 'Speichern',
      delete: 'Löschen',
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
    },
    nav: {
      home: 'Startseite',
      settings: 'Einstellungen',
      profile: 'Profil',
      logout: 'Abmelden',
    },
  },
  ja: {
    voice: {
      startRecording: '録音開始',
      stopRecording: '録音停止',
      processing: '処理中...',
      listening: '聴取中...',
      error: '音声エラー',
      permissionDenied: 'マイク権限が拒否されました',
      notSupported: '音声入力はサポートされていません',
      language: '言語',
    },
    common: {
      cancel: 'キャンセル',
      confirm: '確認',
      save: '保存',
      delete: '削除',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
    },
    nav: {
      home: 'ホーム',
      settings: '設定',
      profile: 'プロフィール',
      logout: 'ログアウト',
    },
  },
  fr: {
    voice: {
      startRecording: 'Démarrer l\'enregistrement',
      stopRecording: 'Arrêter l\'enregistrement',
      processing: 'Traitement...',
      listening: 'Écoute...',
      error: 'Erreur vocale',
      permissionDenied: 'Permission microphone refusée',
      notSupported: 'Saisie vocale non supportée',
      language: 'Langue',
    },
    common: {
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Sauvegarder',
      delete: 'Supprimer',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
    },
    nav: {
      home: 'Accueil',
      settings: 'Paramètres',
      profile: 'Profil',
      logout: 'Déconnexion',
    },
  },
  pt: {
    voice: {
      startRecording: 'Iniciar Gravação',
      stopRecording: 'Parar Gravação',
      processing: 'Processando...',
      listening: 'Ouvindo...',
      error: 'Erro de Voz',
      permissionDenied: 'Permissão do microfone negada',
      notSupported: 'Entrada de voz não suportada',
      language: 'Idioma',
    },
    common: {
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Salvar',
      delete: 'Excluir',
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
    },
    nav: {
      home: 'Início',
      settings: 'Configurações',
      profile: 'Perfil',
      logout: 'Sair',
    },
  },
  it: {
    voice: {
      startRecording: 'Avvia Registrazione',
      stopRecording: 'Ferma Registrazione',
      processing: 'Elaborazione...',
      listening: 'In ascolto...',
      error: 'Errore Vocale',
      permissionDenied: 'Permesso microfono negato',
      notSupported: 'Input vocale non supportato',
      language: 'Lingua',
    },
    common: {
      cancel: 'Annulla',
      confirm: 'Conferma',
      save: 'Salva',
      delete: 'Elimina',
      loading: 'Caricamento...',
      error: 'Errore',
      success: 'Successo',
    },
    nav: {
      home: 'Home',
      settings: 'Impostazioni',
      profile: 'Profilo',
      logout: 'Disconnetti',
    },
  },
};

// I18n state type
interface I18nState {
  locale: Locale;
  dictionaries: Record<Locale, I18nDictionary>;
}

// I18n actions
type I18nAction = { type: 'SET_LOCALE'; payload: Locale };

// Reducer
function i18nReducer(state: I18nState, action: I18nAction): I18nState {
  switch (action.type) {
    case 'SET_LOCALE':
      return {
        ...state,
        locale: action.payload,
      };
    default:
      return state;
  }
}

// Context types
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, any>) => string;
  dictionaries: Record<Locale, I18nDictionary>;
}

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

// Create context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider component
export function I18nProvider({ children, defaultLocale = 'en' }: I18nProviderProps) {
  const [state, dispatch] = useReducer(i18nReducer, {
    locale: defaultLocale,
    dictionaries: DICTIONARIES,
  });

  const setLocale = (locale: Locale) => {
    if (LOCALES.includes(locale)) {
      dispatch({ type: 'SET_LOCALE', payload: locale });
    }
  };

  // Translation function with nested key support and parameter interpolation
  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = state.dictionaries[state.locale];

    // Navigate nested keys
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = state.dictionaries.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in any dictionary
          }
        }
        break;
      }
    }

    // If value is still an object, return the key
    if (typeof value === 'object') {
      return key;
    }

    // Parameter interpolation
    let result = String(value);
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\$\\{${paramKey}\\}`, 'g'), String(paramValue));
      }
    }

    return result;
  };

  const contextValue: I18nContextType = {
    locale: state.locale,
    setLocale,
    t,
    dictionaries: state.dictionaries,
  };

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

// Hook to use i18n
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Utility functions
export function getLanguageName(locale: Locale): string {
  return LANGUAGE_NAMES[locale] || locale;
}

export function isValidLocale(locale: string): locale is Locale {
  return LOCALES.includes(locale as Locale);
}

// Default export for convenience
export default {
  LOCALES,
  useI18n,
  I18nProvider,
  getLanguageName,
  isValidLocale,
};