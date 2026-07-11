import {
  Calculator as CalcIcon,
  LineChart,
  Globe,
  ChevronRight,
  ChevronLeft,
  Sigma,
  Settings,
  Bookmark,
  Grid,
  Moon,
  Plus,
  Trash2,
  Download,
  Upload,
  Youtube,
  Map,
  Figma,
  Box,
  Code,
  Code2,
  AppWindow,
  Navigation2,
  MoreHorizontal,
  Info,
  PanelBottom,
  Timer,
  Wrench,
  EyeOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import bannerImg from "../../../assets/presentorbanaer.jpg";
import packageJson from "../../../../package.json";
import { useEditor, createShapeId } from "@tldraw/tldraw";
import { getEmbedDef } from "../utils/embedUtils";
import { tauriApi } from "../tauri-api"
import { handModeEnabledSignal } from "../store/styleSignals"

export type ToolbarLocation = "main" | "nav" | "hidden";

export interface ToolbarSettings {
  copyPaste: ToolbarLocation;
  undoRedo: ToolbarLocation;
  colorPalette: ToolbarLocation;
  penTools: ToolbarLocation;
  eraser: ToolbarLocation;
  shapes: ToolbarLocation;
  handTool: ToolbarLocation;
  lockPage: ToolbarLocation;
  addPage: ToolbarLocation;
  pageNav: ToolbarLocation;
  zoomInOut: ToolbarLocation;
  fitToScreen: ToolbarLocation;
}

interface ToolsSidebarProps {
  onImportClick?: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  showNavPanel: boolean;
  onToggleNavPanel: () => void;
  showRecentColors: boolean;
  onToggleRecentColors: () => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  toolbarSettings?: ToolbarSettings;
  onToolbarSettingsChange?: (settings: ToolbarSettings) => void;
  onOpenTimer?: () => void;
  onOpenCalculator?: () => void;
  side?: "left" | "right";
}

interface Bookmark {
  name: string;
  url: string;
}

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { name: "zperiod.app", url: "https://zperiod.app/?lang=hi" },
  { name: "GeoGebra", url: "https://www.geogebra.org/calculator" },
  { name: "PhET Simulations", url: "https://phet.colorado.edu/en/simulations/filter" }
];

export function ToolsSidebar({
  onImportClick,
  onOpenProject,
  onSaveProject,
  showNavPanel,
  onToggleNavPanel,
  showRecentColors,
  onToggleRecentColors,
  isOpen,
  onToggle,
  toolbarSettings,
  onToolbarSettingsChange,
  onOpenTimer,
  onOpenCalculator,
  side = "right",
}: ToolsSidebarProps) {
  const editor = useEditor();
  const [showAbout, setShowAbout] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<"root" | "embeds">("root");
  const [showCustomize, setShowCustomize] = useState(false);
  const [customizeTab, setCustomizeTab] = useState<"drawing" | "navigation">("drawing");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [customBookmarks, setCustomBookmarks] = useState<Bookmark[]>([]);
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("");

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowTools(false);
    setShowSettings(false);
    setShowCustomize(false);
    setShowBookmarks(false);
    setSettingsView("root");
  };

  // Open one dropdown and close others
  const openDropdown = (dropdown: "tools") => {
    closeAllDropdowns();
    if (dropdown === "tools") setShowTools(true);
  };

  const defaultSettings: ToolbarSettings = {
    copyPaste: "main",
    undoRedo: "main",
    colorPalette: "main",
    penTools: "main",
    eraser: "main",
    shapes: "main",
    handTool: "nav",
    lockPage: "nav",
    addPage: "main",
    pageNav: "main",
    zoomInOut: "hidden",
    fitToScreen: "nav",
  };

  const settings = toolbarSettings || defaultSettings;

  const updateSetting = (key: keyof ToolbarSettings, value: ToolbarLocation) => {
    if (onToolbarSettingsChange) {
      onToolbarSettingsChange({ ...settings, [key]: value });
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("tools-sidebar-custom-bookmarks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out any default bookmarks that might have been saved in the old system
        const filtered = parsed.filter((bm: Bookmark) => 
          !DEFAULT_BOOKMARKS.some(dbm => dbm.url === bm.url)
        );
        setCustomBookmarks(filtered);
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
  }, []);

  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    setCustomBookmarks(newBookmarks);
    localStorage.setItem(
      "tools-sidebar-custom-bookmarks",
      JSON.stringify(newBookmarks),
    );
  };

  const addBookmark = () => {
    if (!newBookmarkUrl) return;
    let url = newBookmarkUrl;
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    // Check if it's already in defaults
    if (DEFAULT_BOOKMARKS.some(dbm => dbm.url === url)) {
      setNewBookmarkUrl("");
      return;
    }

    // Simple naming strategy: domain name or full URL
    let name = url.replace(/https?:\/\//, "");
    if (name.includes("/")) name = name.split("/")[0];

    const newBookmarks = [...customBookmarks, { name, url }];
    saveBookmarks(newBookmarks);
    setNewBookmarkUrl("");
  };

  const removeBookmark = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newBookmarks = customBookmarks.filter((_, i) => i !== index);
    saveBookmarks(newBookmarks);
  };

  const openBookmark = (url: string) => {
    tauriApi.openInBrowser(url);
  };

  const toggleGrid = () => {
    editor.updateInstanceState({
      isGridMode: !editor.getInstanceState().isGridMode,
    });
  };

  const toggleDarkMode = () => {
    const currentTheme = editor.user.getUserPreferences().colorScheme;
    editor.user.updateUserPreferences({
      colorScheme: currentTheme === "dark" ? "light" : "dark",
    });
  };

  const addEmbed = (type: string, name: string) => {
    const url = prompt(`Enter ${name} URL:`);
    if (!url) return;

    const def = getEmbedDef(type);
    const embedUrl = def.toEmbedUrl(url);
    const center = editor.getViewportScreenCenter();

    editor.createShape({
      id: createShapeId(),
      type: "embed",
      x: center.x - def.width / 2,
      y: center.y - def.height / 2,
      props: {
        w: def.width,
        h: def.height,
        url: embedUrl,
      },
    });

    setShowSettings(false);
    setSettingsView("root");
  };

  const openSystemCalculator = async () => {
    await tauriApi.openSystemCalculator();
  };

  const openBrowser = () => {
    tauriApi.openInBrowser("https://google.com");
  };

return (
    <>
      {/* Collapse toggle when sidebar is closed */}
      {!isOpen && (
        <button
          data-sidebar
          onClick={() => onToggle(true)}
          className={`absolute ${side === 'right' ? 'right-3' : 'left-3'} top-2 z-[99999] p-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 backdrop-blur-md rounded-lg hover:from-cyan-300 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/30`}
          title="Expand Tools"
        >
          {side === 'right' ? (
            <ChevronLeft size={16} className="text-white drop-shadow-md" />
          ) : (
            <ChevronRight size={16} className="text-white drop-shadow-md" />
          )}
        </button>
      )}

      {/* Main Sidebar */}
      <div
        data-sidebar
        className={`absolute top-2 ${side === 'right' ? 'right-3' : 'left-3'} z-[99998] transition-all duration-300 ${isOpen ? "translate-x-0 opacity-100" : (side === 'right' ? "translate-x-64" : "-translate-x-64") + " opacity-0 pointer-events-none"}`}
      >
        <div className="w-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center py-2 gap-2">
          {/* Header / Collapse */}
          {isOpen && (
            <button
              onClick={() => onToggle(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
              title="Collapse"
            >
              {side === 'right' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}

          {/* Tools */}
          <div className="flex flex-col gap-2 w-full px-1.5">
            <ToolButton
              icon={Timer}
              label="Timer"
              onClick={() => {
                onOpenTimer?.();
              }}
              side={side}
            />

            <ToolButton 
              icon={CalcIcon} 
              label="Calculator" 
              onClick={openSystemCalculator} 
              side={side} 
            />

            <ToolButton 
              icon={Globe} 
              label="Browser" 
              onClick={openBrowser} 
              side={side} 
            />

            <div className="relative">
              <ToolButton icon={Bookmark} label="Bookmarks" onClick={() => showBookmarks ? setShowBookmarks(false) : setShowBookmarks(true)} side={side} />

              {/* Bookmarks dropdown */}
              {showBookmarks && (
                <div className={`absolute ${side === 'right' ? 'right-full mr-3' : 'left-full ml-3'} top-0 flex flex-col gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-1.5 z-[99999] whitespace-nowrap w-52`}>
                  {/* Add bookmark input */}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newBookmarkUrl}
                      onChange={(e) => setNewBookmarkUrl(e.target.value)}
                      placeholder="Add URL..."
                      className="flex-1 text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-500"
                      onKeyDown={(e) => e.key === "Enter" && addBookmark()}
                    />
                    <button
                      onClick={addBookmark}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      disabled={!newBookmarkUrl}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Bookmarks list */}
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto mt-1 custom-scrollbar">
                    {/* Render Default Bookmarks (No Delete Button) */}
                    {DEFAULT_BOOKMARKS.map((bm, i) => (
                      <div
                        key={`def-${i}`}
                        className="group flex items-center justify-between gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
                        onClick={() => openBookmark(bm.url)}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Globe size={14} className="text-blue-500 shrink-0" />
                          <span className="text-sm truncate text-gray-700 dark:text-gray-200 font-medium">
                            {bm.name}
                          </span>
                        </div>
                        {/* No Delete Button for Defaults */}
                      </div>
                    ))}

                    {/* Render Custom Bookmarks */}
                    {customBookmarks.map((bm, i) => (
                      <div
                        key={`custom-${i}`}
                        className="group flex items-center justify-between gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
                        onClick={() => openBookmark(bm.url)}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Globe size={14} className="text-blue-500 shrink-0" />
                          <span className="text-sm truncate text-gray-700 dark:text-gray-200 font-medium">
                            {bm.name}
                          </span>
                        </div>
                        <button
                          onClick={(e) => removeBookmark(e, i)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    {DEFAULT_BOOKMARKS.length === 0 && customBookmarks.length === 0 && (
                      <p className="text-xs text-gray-400 italic text-center py-2">No bookmarks</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Tools */}
            <div className="flex flex-col gap-1 w-full px-1.5 pb-1 pt-1">
              {/* Layout Button */}
              <ToolButton
                icon={PanelBottom}
                label="Layout"
                onClick={() => {
                  onToggle(true);
                  setShowCustomize(true);
                }}
                side={side}
              />

              {/* About Button */}
              <ToolButton
                icon={Info}
                label="About"
                onClick={() => {
                  onToggle(true);
                  setShowAbout(true);
                }}
                side={side}
              />
</div>
          </div>
        </div>
      </div>

{/* About Popup Overlay */}
      {showAbout && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: 16,
              padding: 32,
              maxWidth: 420,
              width: "90%",
              color: "white",
              boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <img
              src={bannerImg}
              alt="Presentorbord Banner"
              style={{
                width: '100%',
                borderRadius: 12,
                marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                Presentorbord
              </h2>
              <span style={{
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                padding: '2px 8px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 600,
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                v{packageJson.version}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
              An interactive digital whiteboard built for teaching and
              presenting. Features include multi-page support, PDF import,
              geometry tools, drawing with pen snapping, and much more.
            </p>
            <div style={{
              marginBottom: 20,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>
                Funded by <a href="https://www.youtube.com/@LearnandShareeducation" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>Learn&Share</a>
              </p>
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
              Built with Tauri, React, and tldraw.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a
                href="https://github.com/sakshamagarwalm2/Presentorbord"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: "#334155",
                  color: "white",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                GitHub
              </a>
              <a
                href="https://www.youtube.com/@LearnandShareeducation"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: "#ef4444",
                  color: "white",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <Youtube size={18} />
                YouTube
              </a>
              <button
                onClick={() => setShowAbout(false)}
                style={{
                  padding: "8px 16px",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Popup Overlay */}
      {showCustomize && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, rgba(20,30,48,0.95) 0%, rgba(36,59,85,0.95) 50%, rgba(15,23,42,0.98) 100%)",
              borderRadius: 24,
              padding: 24,
              width: "90%",
              maxWidth: 440,
              color: "white",
              boxShadow: "0 0 60px rgba(139,92,246,0.3), 0 0 100px rgba(59,130,246,0.2), 0 25px 80px rgba(0,0,0,0.5)",
              border: "1px solid rgba(139,92,246,0.4)",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, textShadow: '0 0 20px rgba(139,92,246,0.5)' }}>
                Customize
              </h2>
              <button
                onClick={() => setShowCustomize(false)}
                style={{
                  background: "linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(220,38,38,0.9) 100%)",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: "0 4px 15px rgba(239,68,68,0.4)",
                }}
              >
                Close
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 14, border: '1px solid rgba(139,92,246,0.2)' }}>
              <button
                onClick={() => setCustomizeTab("drawing")}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: customizeTab === "drawing" ? "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" : "transparent",
                  color: customizeTab === "drawing" ? "white" : "rgba(255,255,255,0.5)",
                  boxShadow: customizeTab === "drawing" ? "0 0 20px rgba(139,92,246,0.5)" : "none",
                  textShadow: customizeTab === "drawing" ? "0 0 10px rgba(255,255,255,0.3)" : "none",
                }}
              >
                Drawing
              </button>
              <button
                onClick={() => setCustomizeTab("navigation")}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: customizeTab === "navigation" ? "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" : "transparent",
                  color: customizeTab === "navigation" ? "white" : "rgba(255,255,255,0.5)",
                  boxShadow: customizeTab === "navigation" ? "0 0 20px rgba(139,92,246,0.5)" : "none",
                  textShadow: customizeTab === "navigation" ? "0 0 10px rgba(255,255,255,0.3)" : "none",
                }}
              >
                Navigation
              </button>
            </div>

            {/* Drawing Toolbar Options */}
            {customizeTab === "drawing" && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <ToggleOption name="Copy/Paste" settingKey="copyPaste" settings={settings} onChange={updateSetting} />
                <ToggleOption name="Undo/Redo" settingKey="undoRedo" settings={settings} onChange={updateSetting} />
                <ToggleOption name="Colors" settingKey="colorPalette" settings={settings} onChange={updateSetting} />
                <ToggleOption name="Pen Tools" settingKey="penTools" settings={settings} onChange={updateSetting} />
                <ToggleOption name="Eraser" settingKey="eraser" settings={settings} onChange={updateSetting} />
                <ToggleOption name="Shapes" settingKey="shapes" settings={settings} onChange={updateSetting} />
              </div>
            )}

            {/* Navigation Options - show in Drawing or Nav Panel */}
            {customizeTab === "navigation" && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <NavOption name="Hand Tool" settingKey="handTool" settings={settings} onChange={updateSetting} color="#f472b6" />
                <NavOption name="Lock Page" settingKey="lockPage" settings={settings} onChange={updateSetting} color="#fb923c" />
                <NavOption name="Page Nav" settingKey="pageNav" settings={settings} onChange={updateSetting} color="#a78bfa" />
                <NavOption name="Add Page" settingKey="addPage" settings={settings} onChange={updateSetting} color="#34d399" />
                <NavOption name="Zoom" settingKey="zoomInOut" settings={settings} onChange={updateSetting} color="#38bdf8" />
                <NavOption name="Fit Screen" settingKey="fitToScreen" settings={settings} onChange={updateSetting} color="#fbbf24" />
                <InvisibleCursorToggle />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ToolButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  side = "right",
  isExternalActive = false,
}: {
  icon: any;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  side?: "left" | "right";
  isExternalActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${isActive ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
      title={label}
    >
      <Icon size={18} strokeWidth={1.5} />
      {isExternalActive && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border border-white dark:border-gray-900 shadow-sm" />
      )}
      <span className={`text-[9px] font-medium mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute bg-gray-800 text-white px-2 py-0.5 rounded-md ${side === 'right' ? 'right-full mr-2' : 'left-full ml-2'} whitespace-nowrap pointer-events-none z-[100]`}>
        {label}
      </span>
    </button>
  );
}

function ToggleOption({
  name,
  settingKey,
  settings,
  onChange,
}: {
  name: string;
  settingKey: keyof ToolbarSettings;
  settings: ToolbarSettings;
  onChange: (key: keyof ToolbarSettings, value: ToolbarLocation) => void;
}) {
  const location = settings[settingKey] || "main";
  const isMain = location === "main";
  const isHidden = location === "hidden";

  const cycleLocation = () => {
    if (location === "main") {
      onChange(settingKey, "hidden");
    } else if (location === "hidden") {
      onChange(settingKey, "main");
    } else {
      onChange(settingKey, "main");
    }
  };

  const getStatusText = () => {
    if (location === "hidden") return "Hide";
    if (location === "nav") return "Nav";
    return "Main";
  };

  const mainColor = "#8b5cf6"; // Purple for Main
  const hiddenColor = "#f87171"; // Red for Hide

  const currentColor = isHidden ? hiddenColor : mainColor;

  return (
    <button
      onClick={cycleLocation}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: isHidden 
          ? "linear-gradient(135deg, rgba(248,113,113,0.2) 0%, rgba(239,68,68,0.15) 100%)"
          : "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.2) 100%)",
        borderRadius: 12,
        border: isHidden 
          ? "1px solid rgba(248,113,113,0.5)" 
          : "1px solid rgba(139,92,246,0.5)",
        cursor: "pointer",
        boxShadow: isHidden 
          ? "0 0 15px rgba(248,113,113,0.2)" 
          : "0 0 15px rgba(139,92,246,0.2)",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: isHidden ? "#fca5a5" : "#c4b5fd", textShadow: `0 0 10px ${currentColor}50` }}>{name}</span>
      <span style={{ 
        fontSize: 11, 
        fontWeight: 700, 
        color: currentColor,
        background: `${currentColor}30`,
        padding: "4px 10px",
        borderRadius: 8,
      }}>
        {getStatusText()}
      </span>
    </button>
  );
}

function NavOption({
  name,
  settingKey,
  settings,
  onChange,
  color = "#8b5cf6",
}: {
  name: string;
  settingKey: keyof ToolbarSettings;
  settings: ToolbarSettings;
  onChange: (key: keyof ToolbarSettings, value: ToolbarLocation) => void;
  color?: string;
}) {
  const location = settings[settingKey] || "main";
  const isInNav = location === "nav";
  const isHidden = location === "hidden";

  const cycleLocation = () => {
    if (location === "main") {
      onChange(settingKey, "nav");
    } else if (location === "nav") {
      onChange(settingKey, "hidden");
    } else {
      onChange(settingKey, "main");
    }
  };

  const getStatusText = () => {
    if (location === "hidden") return "Hide";
    if (location === "nav") return "Nav";
    return "Main";
  };

  const mainColor = "#8b5cf6"; // Purple for Main
  const hiddenColor = "#f87171"; // Red for Hide
  
  // Use passed color for Nav, mainColor for Main, hiddenColor for Hide
  const currentColor = isHidden ? hiddenColor : (isInNav ? color : mainColor);

  const getBackground = () => {
    if (isHidden) return "linear-gradient(135deg, rgba(248,113,113,0.2) 0%, rgba(239,68,68,0.15) 100%)";
    if (isInNav) return `linear-gradient(135deg, ${color}40 0%, ${color}30 100%)`;
    return "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.2) 100%)";
  };

  const getBorder = () => {
    if (isHidden) return "1px solid rgba(248,113,113,0.5)";
    if (isInNav) return `1px solid ${color}80`;
    return "1px solid rgba(139,92,246,0.5)";
  };

  const getBoxShadow = () => {
    if (isHidden) return "0 0 15px rgba(248,113,113,0.2)";
    if (isInNav) return `0 0 15px ${color}30`;
    return "0 0 15px rgba(139,92,246,0.2)";
  };

  return (
    <button
      onClick={cycleLocation}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: getBackground(),
        borderRadius: 12,
        border: getBorder(),
        cursor: "pointer",
        boxShadow: getBoxShadow(),
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: isHidden ? "#fca5a5" : isInNav ? color : "#c4b5fd", textShadow: `0 0 10px ${currentColor}50` }}>{name}</span>
      <span style={{ 
        fontSize: 11, 
        fontWeight: 700, 
        color: currentColor,
        background: `${currentColor}30`,
        padding: "4px 10px",
        borderRadius: 8,
      }}>
        {getStatusText()}
      </span>
    </button>
  );
}

function ToolbarOption({
  name,
  showNavPanelOption,
  settings,
  onChange,
}: {
  name: string;
  showNavPanelOption?: boolean;
  settings: ToolbarSettings;
  onChange: (key: keyof ToolbarSettings, value: ToolbarLocation) => void;
}) {
  const keyMap: Record<string, keyof ToolbarSettings> = {
    "copypaste": "copyPaste",
    "undoredo": "undoRedo",
    "colorpalette": "colorPalette",
    "pentools": "penTools",
    "eraser": "eraser",
    "shapes": "shapes",
    "handtool": "handTool",
    "lockpage": "lockPage",
    "addpage": "addPage",
    "zoominout": "zoomInOut",
    "fittoscreen": "fitToScreen",
  };

  const key = keyMap[name.toLowerCase().replace(/[\/\s]/g, "")] || "copyPaste";
  const currentLocation = settings[key] || "main";

  const handleLocationChange = (location: ToolbarLocation) => {
    onChange(key, location);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: 10,
        border: currentLocation === "hidden" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{name}</span>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          onClick={() => handleLocationChange("main")}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "none",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            background: currentLocation === "main" ? "#3b82f6" : "rgba(255,255,255,0.1)",
            color: currentLocation === "main" ? "white" : "#94a3b8",
          }}
        >
          Main
        </button>
        {showNavPanelOption && (
          <button
            onClick={() => handleLocationChange("nav")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              background: currentLocation === "nav" ? "#3b82f6" : "rgba(255,255,255,0.1)",
              color: currentLocation === "nav" ? "white" : "#94a3b8",
            }}
          >
            Nav
          </button>
        )}
        <button
          onClick={() => handleLocationChange("hidden")}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "none",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            background: currentLocation === "hidden" ? "#ef4444" : "rgba(255,255,255,0.1)",
            color: currentLocation === "hidden" ? "white" : "#94a3b8",
          }}
        >
          Off
        </button>
      </div>
    </div>
  );
}

function InvisibleCursorToggle() {
  const [enabled, setEnabled] = useState(handModeEnabledSignal.get())

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    handModeEnabledSignal.set(next)
    localStorage.setItem('hand-mode-enabled', String(next))
  }

  return (
    <button
      onClick={toggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: enabled
          ? "linear-gradient(135deg, rgba(34,197,94,0.25) 0%, rgba(22,163,74,0.2) 100%)"
          : "linear-gradient(135deg, rgba(248,113,113,0.2) 0%, rgba(239,68,68,0.15) 100%)",
        borderRadius: 12,
        border: enabled
          ? "1px solid rgba(34,197,94,0.5)"
          : "1px solid rgba(248,113,113,0.5)",
        cursor: "pointer",
        boxShadow: enabled
          ? "0 0 15px rgba(34,197,94,0.2)"
          : "0 0 15px rgba(248,113,113,0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <EyeOff size={14} style={{ color: enabled ? "#4ade80" : "#fca5a5" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: enabled ? "#4ade80" : "#fca5a5" }}>
          Invisible Cursor
        </span>
      </div>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: enabled ? "#22c55e" : "#f87171",
        background: enabled ? "rgba(34,197,94,0.2)" : "rgba(248,113,113,0.2)",
        padding: "4px 10px",
        borderRadius: 8,
      }}>
        {enabled ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
