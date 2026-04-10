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
} from "lucide-react";
import { useEffect, useState } from "react";
import bannerImg from "../../../assets/presentorbanaer.jpg";
import packageJson from "../../../../package.json";
import { useEditor, createShapeId } from "@tldraw/tldraw";
import { getEmbedDef } from "../utils/embedUtils";

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
}

interface Bookmark {
  name: string;
  url: string;
}

export function ToolsSidebar({
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
}: ToolsSidebarProps) {
  const editor = useEditor();
  const [showAbout, setShowAbout] = useState(false);
  const [showMathTools, setShowMathTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<"root" | "embeds">("root");
  const [showCustomize, setShowCustomize] = useState(false);
  const [customizeTab, setCustomizeTab] = useState<"drawing" | "navigation">("drawing");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("");

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowMathTools(false);
    setShowSettings(false);
    setShowCustomize(false);
    setShowBookmarks(false);
    setSettingsView("root");
  };

  // Open one dropdown and close others
  const openDropdown = (dropdown: "math") => {
    closeAllDropdowns();
    if (dropdown === "math") setShowMathTools(true);
  };

  const defaultSettings: ToolbarSettings = {
    copyPaste: "main",
    undoRedo: "main",
    colorPalette: "main",
    penTools: "main",
    eraser: "main",
    shapes: "main",
    handTool: "main",
    lockPage: "main",
    addPage: "main",
    zoomInOut: "nav",
    fitToScreen: "nav",
  };

  const settings = toolbarSettings || defaultSettings;

  const updateSetting = (key: keyof ToolbarSettings, value: ToolbarLocation) => {
    if (onToolbarSettingsChange) {
      onToolbarSettingsChange({ ...settings, [key]: value });
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("tools-sidebar-bookmarks");
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
  }, []);

  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem(
      "tools-sidebar-bookmarks",
      JSON.stringify(newBookmarks),
    );
  };

  const addBookmark = () => {
    if (!newBookmarkUrl) return;
    let url = newBookmarkUrl;
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    // Simple naming strategy: domain name or full URL
    let name = url.replace(/https?:\/\//, "");
    if (name.includes("/")) name = name.split("/")[0];

    const newBookmarks = [...bookmarks, { name, url }];
    saveBookmarks(newBookmarks);
    setNewBookmarkUrl("");
  };

  const removeBookmark = (index: number) => {
    const newBookmarks = bookmarks.filter((_, i) => i !== index);
    saveBookmarks(newBookmarks);
  };

  const openBookmark = (url: string) => {
    window.open(url, "_blank");
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
    // @ts-ignore
    if (window.electron && window.electron.ipcRenderer) {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke("open-system-calculator");
    } else {
      alert("System Calculator only available in Electron mode");
    }
  };

  const openBrowser = () => {
    window.open("https://google.com", "_blank");
  };

  const openGraph = () => {
    window.open("https://www.desmos.com/calculator", "_blank");
  };

return (
    <>
      {/* Collapse toggle when sidebar is closed */}
      {!isOpen && (
        <button
          data-sidebar
          onClick={() => onToggle(true)}
          className="absolute right-3 top-2 z-[99999] p-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 backdrop-blur-md rounded-lg hover:from-cyan-300 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/30"
          title="Expand Tools"
        >
          <ChevronLeft size={16} className="text-white drop-shadow-md" />
        </button>
      )}

      {/* Main Sidebar - Right Side */}
      <div
        data-sidebar
        className={`absolute top-2 right-3 z-[99998] transition-all duration-300 ${isOpen ? "translate-x-0 opacity-100" : "translate-x-64 opacity-0 pointer-events-none"}`}
      >
        <div className="w-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center py-2 gap-2">
          {/* Header / Collapse */}
          {isOpen && (
            <button
              onClick={() => onToggle(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
              title="Collapse"
            >
              <ChevronRight size={16} />
            </button>
          )}

          {/* Tools */}
          <div className="flex flex-col gap-2 w-full px-1.5">

            {/* Math Group */}
            <div className="relative">
              <ToolButton
                icon={Sigma}
                label="Math"
                isActive={showMathTools}
                onClick={() => showMathTools ? setShowMathTools(false) : openDropdown("math")}
              />

              {/* Math Sub-menu - horizontal row right next to button */}
              {showMathTools && (
                <div className="absolute right-full top-0 ml-3 flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg rounded-xl border border-gray-200/50 dark:border-gray-700/50 px-1.5 py-1 z-[99999] whitespace-nowrap">
                  <ToolButton
                    icon={CalcIcon}
                    label="Calculator"
                    onClick={() => {
                      openSystemCalculator();
                      setShowMathTools(false);
                    }}
                  />
                  <ToolButton
                    icon={LineChart}
                    label="Graph"
                    onClick={() => {
                      openGraph();
                      setShowMathTools(false);
                    }}
                  />
                </div>
              )}
            </div>

            <ToolButton icon={Globe} label="Browser" onClick={openBrowser} />

            <div className="relative">
              <ToolButton icon={Bookmark} label="Bookmarks" onClick={() => showBookmarks ? setShowBookmarks(false) : setShowBookmarks(true)} />

              {/* Bookmarks dropdown */}
              {showBookmarks && (
                <div className="absolute right-full top-0 ml-3 flex flex-col gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-1.5 z-[99999] whitespace-nowrap w-52">
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
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                    {bookmarks.length === 0 && (
                      <p className="text-xs text-gray-400 italic text-center py-2">No bookmarks</p>
                    )}
                    {bookmarks.map((bm: Bookmark, i: number) => (
                      <button
                        key={i}
                        onClick={() => openBookmark(bm.url)}
                        className="flex items-center gap-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
                      >
                        <Globe size={14} className="text-blue-500" />
                        <span className="text-sm truncate">{bm.name}</span>
                      </button>
                    ))}
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
              />

              {/* About Button */}
              <ToolButton
                icon={Info}
                label="About"
                onClick={() => {
                  onToggle(true);
                  setShowAbout(true);
                }}
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
              Built with Electron, React, and tldraw.
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
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: 20,
              padding: 24,
              width: "90%",
              maxWidth: 420,
              color: "white",
              boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                Customize
              </h2>
              <button
                onClick={() => setShowCustomize(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 10 }}>
              <button
                onClick={() => setCustomizeTab("drawing")}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: customizeTab === "drawing" ? "#3b82f6" : "transparent",
                  color: customizeTab === "drawing" ? "white" : "#94a3b8",
                }}
              >
                Drawing
              </button>
              <button
                onClick={() => setCustomizeTab("navigation")}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: customizeTab === "navigation" ? "#3b82f6" : "transparent",
                  color: customizeTab === "navigation" ? "white" : "#94a3b8",
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
                <NavOption name="Hand Tool" settingKey="handTool" settings={settings} onChange={updateSetting} />
                <NavOption name="Lock Page" settingKey="lockPage" settings={settings} onChange={updateSetting} />
                <NavOption name="Page Nav" settingKey="pageNav" settings={settings} onChange={updateSetting} />
                <NavOption name="Add Page" settingKey="addPage" settings={settings} onChange={updateSetting} />
                <NavOption name="Zoom" settingKey="zoomInOut" settings={settings} onChange={updateSetting} />
                <NavOption name="Fit Screen" settingKey="fitToScreen" settings={settings} onChange={updateSetting} />
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
}: {
  icon: any;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${isActive ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
      title={label}
    >
      <Icon size={18} strokeWidth={1.5} />
      <span className="text-[9px] font-medium mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute bg-gray-800 text-white px-2 py-0.5 rounded-md right-full mr-2 whitespace-nowrap pointer-events-none z-[100]">
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
  const isEnabled = settings[settingKey] !== "hidden";

  return (
    <button
      onClick={() => onChange(settingKey, isEnabled ? "hidden" : "main")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: isEnabled ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.06)",
        borderRadius: 8,
        border: isEnabled ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 500, color: isEnabled ? "#60a5fa" : "#94a3b8" }}>{name}</span>
      <div
        style={{
          width: 32,
          height: 16,
          borderRadius: 8,
          background: isEnabled ? "#3b82f6" : "rgba(255,255,255,0.15)",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: "white",
            position: "absolute",
            top: 2,
            left: isEnabled ? 18 : 2,
          }}
        />
      </div>
    </button>
  );
}

function NavOption({
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
  const isInNav = location === "nav";

  return (
    <button
      onClick={() => onChange(settingKey, isInNav ? "main" : "nav")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: isInNav ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.06)",
        borderRadius: 8,
        border: isInNav ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 500, color: isInNav ? "#60a5fa" : "#94a3b8" }}>{name}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: isInNav ? "#3b82f6" : "#64748b" }}>
        {isInNav ? "Nav" : "Main"}
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
