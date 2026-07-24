import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Note, Gadget, AppSettings, ModuleId, Snippet, FocusSession, CheatsheetCommand, Bookmark } from '../types';
import { storage } from '../utils/storage';

interface AppContextType {
  projects: Project[];
  notes: Note[];
  gadgets: Gadget[];
  settings: AppSettings;
  activeModule: ModuleId;
  viewMode: 'landing' | 'app';
  
  // Snippets
  snippets: Snippet[];
  addSnippet: (snippet: Omit<Snippet, 'id' | 'updatedAt'>) => void;
  updateSnippet: (snippet: Snippet) => void;
  deleteSnippet: (id: string) => void;

  // Focus Sessions
  focusSessions: FocusSession[];
  addFocusSession: (session: Omit<FocusSession, 'id'>) => void;

  // Cheatsheets
  cheatsheets: CheatsheetCommand[];
  addCheatsheet: (command: Omit<CheatsheetCommand, 'id'>) => void;
  deleteCheatsheet: (id: string) => void;

  // Bookmarks
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Omit<Bookmark, 'id'>) => void;
  updateBookmark: (bookmark: Bookmark) => void;
  deleteBookmark: (id: string) => void;

  // Navigation
  setModule: (module: ModuleId) => void;
  setViewMode: (mode: 'landing' | 'app') => void;
  
  // Projects
  addProject: (project: Omit<Project, 'id' | 'updatedAt'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  
  // Notes
  addNote: (note: Omit<Note, 'id' | 'updatedAt'>) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  
  // Gadgets
  addGadget: (gadget: Omit<Gadget, 'id'>) => void;
  updateGadget: (gadget: Gadget) => void;
  deleteGadget: (id: string) => void;
  
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewModeState] = useState<'landing' | 'app'>(() => {
    return (localStorage.getItem('nexus_view_mode') as 'landing' | 'app') || 'landing';
  });
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());

  // New modules states
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [cheatsheets, setCheatsheets] = useState<CheatsheetCommand[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Load initial data from storage
  useEffect(() => {
    setProjects(storage.getProjects());
    setNotes(storage.getNotes());
    setGadgets(storage.getGadgets());
    setSnippets(storage.getSnippets());
    setFocusSessions(storage.getFocusSessions());
    setCheatsheets(storage.getCheatsheets());
    setBookmarks(storage.getBookmarks());
  }, []);

  const setModule = (module: ModuleId) => {
    setActiveModule(module);
  };

  const setViewMode = (mode: 'landing' | 'app') => {
    setViewModeState(mode);
    localStorage.setItem('nexus_view_mode', mode);
  };

  // --- PROJECTS ---
  const addProject = (proj: Omit<Project, 'id' | 'updatedAt'>) => {
    const newProject: Project = {
      ...proj,
      id: `proj-${Math.random().toString(36).substring(2, 9)}`,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => {
      const updated = [newProject, ...prev];
      storage.saveProjects(updated);
      return updated;
    });
    storage.logActivity();
  };

  const updateProject = (updatedProj: Project) => {
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === updatedProj.id ? { ...updatedProj, updatedAt: new Date().toISOString() } : p
      );
      storage.saveProjects(updated);
      return updated;
    });
    storage.logActivity();
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      storage.saveProjects(updated);
      return updated;
    });
  };

  // --- NOTES ---
  const addNote = (note: Omit<Note, 'id' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: `note-${Math.random().toString(36).substring(2, 9)}`,
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => {
      const updated = [newNote, ...prev];
      storage.saveNotes(updated);
      return updated;
    });
    storage.logActivity();
  };

  const updateNote = (updatedNote: Note) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : n
      );
      storage.saveNotes(updated);
      return updated;
    });
    storage.logActivity();
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      storage.saveNotes(updated);
      return updated;
    });
  };

  // --- GADGETS ---
  const addGadget = (gadg: Omit<Gadget, 'id'>) => {
    const newGadget: Gadget = {
      ...gadg,
      id: `gadg-${Math.random().toString(36).substring(2, 9)}`,
    };
    setGadgets((prev) => {
      const updated = [newGadget, ...prev];
      storage.saveGadgets(updated);
      return updated;
    });
  };

  const updateGadget = (updatedGadg: Gadget) => {
    setGadgets((prev) => {
      const updated = prev.map((g) => (g.id === updatedGadg.id ? updatedGadg : g));
      storage.saveGadgets(updated);
      return updated;
    });
  };

  const deleteGadget = (id: string) => {
    setGadgets((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      storage.saveGadgets(updated);
      return updated;
    });
  };

  // --- SNIPPETS ---
  const addSnippet = (snip: Omit<Snippet, 'id' | 'updatedAt'>) => {
    const newSnippet: Snippet = {
      ...snip,
      id: `snip-${Math.random().toString(36).substring(2, 9)}`,
      updatedAt: new Date().toISOString(),
    };
    setSnippets((prev) => {
      const updated = [newSnippet, ...prev];
      storage.saveSnippets(updated);
      return updated;
    });
  };

  const updateSnippet = (updatedSnip: Snippet) => {
    setSnippets((prev) => {
      const updated = prev.map((s) =>
        s.id === updatedSnip.id ? { ...updatedSnip, updatedAt: new Date().toISOString() } : s
      );
      storage.saveSnippets(updated);
      return updated;
    });
  };

  const deleteSnippet = (id: string) => {
    setSnippets((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      storage.saveSnippets(updated);
      return updated;
    });
  };

  // --- FOCUS SESSIONS ---
  const addFocusSession = (sess: Omit<FocusSession, 'id'>) => {
    const newSession: FocusSession = {
      ...sess,
      id: `session-${Math.random().toString(36).substring(2, 9)}`,
    };
    setFocusSessions((prev) => {
      const updated = [newSession, ...prev];
      storage.saveFocusSessions(updated);
      return updated;
    });
  };

  // --- CHEATSHEETS ---
  const addCheatsheet = (cmd: Omit<CheatsheetCommand, 'id'>) => {
    const newCommand: CheatsheetCommand = {
      ...cmd,
      id: `cmd-${Math.random().toString(36).substring(2, 9)}`,
      isCustom: true,
    };
    setCheatsheets((prev) => {
      const updated = [newCommand, ...prev];
      storage.saveCheatsheets(updated);
      return updated;
    });
  };

  const deleteCheatsheet = (id: string) => {
    setCheatsheets((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      storage.saveCheatsheets(updated);
      return updated;
    });
  };

  // --- BOOKMARKS ---
  const addBookmark = (bm: Omit<Bookmark, 'id'>) => {
    const newBookmark: Bookmark = {
      ...bm,
      id: `bm-${Math.random().toString(36).substring(2, 9)}`,
    };
    setBookmarks((prev) => {
      const updated = [newBookmark, ...prev];
      storage.saveBookmarks(updated);
      return updated;
    });
  };

  const updateBookmark = (updatedBm: Bookmark) => {
    setBookmarks((prev) => {
      const updated = prev.map((b) => (b.id === updatedBm.id ? updatedBm : b));
      storage.saveBookmarks(updated);
      return updated;
    });
  };

  const deleteBookmark = (id: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      storage.saveBookmarks(updated);
      return updated;
    });
  };

  // --- SETTINGS ---
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const resetAllData = () => {
    localStorage.clear();
    setProjects(storage.getProjects());
    setNotes(storage.getNotes());
    setGadgets(storage.getGadgets());
    setSnippets(storage.getSnippets());
    setFocusSessions(storage.getFocusSessions());
    setCheatsheets(storage.getCheatsheets());
    setBookmarks(storage.getBookmarks());
    setSettings(storage.getSettings());
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        notes,
        gadgets,
        settings,
        activeModule,
        setModule,
        viewMode,
        setViewMode,
        addProject,
        updateProject,
        deleteProject,
        addNote,
        updateNote,
        deleteNote,
        addGadget,
        updateGadget,
        deleteGadget,
        
        // New modules expose
        snippets,
        addSnippet,
        updateSnippet,
        deleteSnippet,
        focusSessions,
        addFocusSession,
        cheatsheets,
        addCheatsheet,
        deleteCheatsheet,
        bookmarks,
        addBookmark,
        updateBookmark,
        deleteBookmark,

        updateSettings,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
