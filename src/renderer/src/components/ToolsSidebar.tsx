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
  Ruler,
  PenTool,
  Compass,
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
  onAddRuler: () => void;
  onAddProtractor: () => void;
  onAddCompass: () => void;
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
  onAddRuler,
  onAddProtractor,
  onAddCompass,
  toolbarSettings,
  onToolbarSettingsChange,
}: ToolsSidebarProps) {
  const editor = useEditor();
  const [showAbout, setShowAbout] = useState(false);
  const [showMathTools, setShowMathTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<"root" | "embeds">("root");
  const [showCustomize, setShowCustomize] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("");

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
      {/* Collapse toggle when sidebar is closed - Right Side */}
      {!isOpen && (
        <button
          data-sidebar
          onClick={() => onToggle(true)}
          className="absolute right-3 top-2 z-[99999] p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all shadow-sm border border-gray-200/50 dark:border-gray-700/50"
          title="Expand Tools"
        >
          <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Main Sidebar - Right Side */}
      <div
        data-sidebar
        className={`absolute top-2 right-3 z-[99998] transform transition-all duration-300 ${isOpen ? "translate-x-0 opacity-100" : "translate-x-64 opacity-0 pointer-events-none"}`}
      >
        <div className="w-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center py-4 gap-4">
          {/* Header / Collapse */}
          <button
            onClick={() => onToggle(false)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors mb-2"
          >
            <ChevronRight size={16} />
          </button>

          {/* Tools */}
          <div className="flex flex-col gap-3 w-full px-2">

            {/* Math Group */}
            <div className="relative">
              <ToolButton
                icon={Sigma}
                label="Math"
                isActive={showMathTools}
                onClick={() => setShowMathTools(!showMathTools)}
              />

              {/* Math Sub-menu */}
              {showMathTools && (
                <div className="absolute right-full top-0 mr-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-2 flex flex-col gap-2">
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
                  <ToolButton
                    icon={Ruler}
                    label="Ruler"
                    onClick={() => {
                      onAddRuler();
                      setShowMathTools(false);
                    }}
                  />
                  <ToolButton
                    icon={PenTool}
                    label="Protractor"
                    onClick={() => {
                      onAddProtractor();
                      setShowMathTools(false);
                    }}
                  />
                  <ToolButton
                    icon={Compass}
                    label="Compass"
                    onClick={() => {
                      onAddCompass();
                      setShowMathTools(false);
                    }}
                  />
                </div>
              )}
            </div>

            <ToolButton icon={Globe} label="Browser" onClick={openBrowser} />
          </div>

          {/* Bottom Tools */}
          <div className="mt-auto flex flex-col gap-3 w-full px-2 pb-2 border-t border-gray-200/50 dark:border-gray-700/50 pt-2">
            {/* Settings Group */}
            <div className="relative">
              <ToolButton
                icon={Settings}
                label="Settings"
                isActive={showSettings}
                onClick={() => {
                  setShowSettings(!showSettings);
                  setSettingsView("root");
                  setShowCustomize(false);
                  setShowMathTools(false);
                }}
              />

              {/* Settings Sub-menu */}
              {showSettings && (
                <div className="absolute right-full bottom-0 mr-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-2 flex flex-col gap-2 min-w-[140px]">
                  {settingsView === "root" ? (
                    <>
                      <ToolButton
                        icon={Grid}
                        label="Grid"
                        onClick={toggleGrid}
                      />
                      <ToolButton
                        icon={Moon}
                        label="Dark Mode"
                        onClick={toggleDarkMode}
                      />
                      <ToolButton
                        icon={AppWindow}
                        label="Add Embed..."
                        onClick={() => setSettingsView("embeds")}
                      />
                      <ToolButton
                        icon={Navigation2}
                        label={
                          showNavPanel ? "Hide Navigation" : "Show Navigation"
                        }
                        isActive={showNavPanel}
                        onClick={onToggleNavPanel}
                      />
                      <ToolButton
                        icon={MoreHorizontal}
                        label={showRecentColors ? "Hide Colors" : "Show Colors"}
                        isActive={showRecentColors}
                        onClick={onToggleRecentColors}
                      />
                      <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
                      <ToolButton
                        icon={Download}
                        label="Save Project"
                        onClick={onSaveProject}
                      />
                      <ToolButton
                        icon={Upload}
                        label="Open Project"
                        onClick={onOpenProject}
                      />
                    </>
                  ) : (
                    <>
                      <ToolButton
                        icon={ChevronRight}
                        label="Back"
                        onClick={() => setSettingsView("root")}
                      />
                      <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
                      <ToolButton
                        icon={Youtube}
                        label="YouTube"
                        onClick={() => addEmbed("youtube", "YouTube")}
                      />
                      <ToolButton
                        icon={Map}
                        label="Google Maps"
                        onClick={() => addEmbed("google_maps", "Google Maps")}
                      />
                      <ToolButton
                        icon={Figma}
                        label="Figma"
                        onClick={() => addEmbed("figma", "Figma")}
                      />
                      <ToolButton
                        icon={Box}
                        label="CodeSandbox"
                        onClick={() => addEmbed("codesandbox", "CodeSandbox")}
                      />
                      <ToolButton
                        icon={Code}
                        label="CodePen"
                        onClick={() => addEmbed("codepen", "CodePen")}
                      />
                      <ToolButton
                        icon={Code2}
                        label="Scratch"
                        onClick={() => addEmbed("scratch", "Scratch")}
                      />
                      <ToolButton
                        icon={Globe}
                        label="Generic"
                        onClick={() => addEmbed("generic", "Website")}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Customize / Bookmarks Group */}
            <div className="relative">
              <ToolButton
                icon={Bookmark}
                label="Customize"
                isActive={showCustomize}
                onClick={() => {
                  setShowCustomize(!showCustomize);
                  setShowSettings(false);
                  setShowMathTools(false);
                }}
              />

              {/* Customize Sub-menu */}
              {showCustomize && (
                <div className="absolute right-full bottom-0 mr-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-3 flex flex-col gap-2 w-64">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Bookmarks
                  </h3>

                  {/* List */}
                  <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                    {bookmarks.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-2">
                        No bookmarks yet
                      </p>
                    )}
                    {bookmarks.map((bm: Bookmark, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 group/item p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <button
                          onClick={() => openBookmark(bm.url)}
                          className="flex-1 flex items-center gap-2 text-left overflow-hidden"
                          title={bm.url}
                        >
                          <Globe
                            size={14}
                            className="text-blue-500 flex-shrink-0"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {bm.name}
                          </span>
                        </button>
                        <button
                          onClick={() => removeBookmark(i)}
                          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <input
                      type="text"
                      value={newBookmarkUrl}
                      onChange={(e) => setNewBookmarkUrl(e.target.value)}
                      placeholder="google.com"
                      className="flex-1 text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-500"
                      onKeyDown={(e) => e.key === "Enter" && addBookmark()}
                    />
                    <button
                      onClick={addBookmark}
                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      disabled={!newBookmarkUrl}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customize Button */}
        <div className="px-2 pt-2">
          <ToolButton
            icon={PanelBottom}
            label="Customize"
            onClick={() => setShowCustomize(true)}
          />
        </div>

        {/* About Button */}
        <div className="px-2 pb-2">
          <ToolButton
            icon={Info}
            label="About"
            onClick={() => setShowAbout(true)}
          />
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
          onClick={() => setShowAbout(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: 16,
              padding: 32,
              maxWidth: 420,
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              color: "white",
              boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.2) transparent",
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
                ✨ Presentorbord
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
              geometry tools (Ruler, Protractor, Compass), drawing with pen
              snapping, and much more.
            </p>
            <div style={{ 
              marginBottom: 20, 
              padding: '10px 14px', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
               <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>
                🚀 <strong>Funded by <a href="https://www.youtube.com/@LearnandShareeducation" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', borderBottom: '1px dashed #60a5fa' }}>Learn&Share</a></strong>
              </p>
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
              Built with ❤️ using Electron, React, and tldraw.
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
                YouTube Channel
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
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowCustomize(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: 16,
              padding: 20,
              maxWidth: 600,
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              color: "white",
              boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              flexDirection: "column",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.2) transparent",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                Customize Toolbar
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
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
                    if (onToolbarSettingsChange) {
                      onToolbarSettingsChange(defaultSettings);
                    }
                  }}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 10px",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowCustomize(false)}
                  style={{
                    background: "#3b82f6",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 10px",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Done
                </button>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
              Choose where each tool should appear. Toggle off to hide from toolbar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Copy/Paste */}
              <ToolbarOption name="Copy/Paste" settings={settings} onChange={updateSetting} />

              {/* Undo/Redo */}
              <ToolbarOption name="Undo/Redo" settings={settings} onChange={updateSetting} />

              {/* Color Palette */}
              <ToolbarOption name="Color Palette" settings={settings} onChange={updateSetting} />

              {/* Pen Tools */}
              <ToolbarOption name="Pen Tools" settings={settings} onChange={updateSetting} />

              {/* Eraser */}
              <ToolbarOption name="Eraser" settings={settings} onChange={updateSetting} />

              {/* Shapes */}
              <ToolbarOption name="Shapes" settings={settings} onChange={updateSetting} />

              {/* Hand Tool */}
              <ToolbarOption name="Hand Tool" showNavPanelOption settings={settings} onChange={updateSetting} />

              {/* Lock Page */}
              <ToolbarOption name="Lock Page" showNavPanelOption settings={settings} onChange={updateSetting} />

              {/* Add Page */}
              <ToolbarOption name="Add Page" showNavPanelOption settings={settings} onChange={updateSetting} />

              {/* Zoom In/Out */}
              <ToolbarOption name="Zoom In/Out" showNavPanelOption settings={settings} onChange={updateSetting} />

              {/* Fit to Screen */}
              <ToolbarOption name="Fit to Screen" showNavPanelOption settings={settings} onChange={updateSetting} />
            </div>
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
      className={`group flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${isActive ? "bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
      title={label}
    >
      <Icon size={24} strokeWidth={1.5} />
      <span className="text-[10px] font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bg-gray-800 text-white px-2 py-1 rounded-md right-full mr-2 whitespace-nowrap pointer-events-none">
        {label}
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
        padding: "8px 12px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => handleLocationChange("main")}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: "none",
            fontSize: 11,
            cursor: "pointer",
            background: currentLocation === "main" ? "#3b82f6" : "rgba(255,255,255,0.1)",
            color: "white",
          }}
        >
          Toolbar
        </button>
        {showNavPanelOption && (
          <button
            onClick={() => handleLocationChange("nav")}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "none",
              fontSize: 11,
              cursor: "pointer",
              background: currentLocation === "nav" ? "#3b82f6" : "rgba(255,255,255,0.1)",
              color: "white",
            }}
          >
            Nav Panel
          </button>
        )}
        <button
          onClick={() => handleLocationChange("hidden")}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: "none",
            fontSize: 11,
            cursor: "pointer",
            background: currentLocation === "hidden" ? "#ef4444" : "rgba(255,255,255,0.1)",
            color: "white",
          }}
        >
          Hide
        </button>
      </div>
    </div>
  );
}
