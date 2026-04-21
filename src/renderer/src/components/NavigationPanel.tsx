import { useEditor } from "@tldraw/tldraw";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ChevronUp, Maximize, Plus, Hand, Lock, Unlock, Type, StickyNote, Frame, ImageIcon, Trash2, Copy, Menu, Minus, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { animateSlideToViewport } from "../utils/slideCamera";
import { ToolbarSettings } from "./ToolsSidebar";

export function NavigationPanel({
  isVisible,
  position = "right",
  navPosition,
  onToggleNavPosition,
  toolbarSettings,
  onAddPage,
  isCompact,
  onToggleSidebar,
  onCloseSidebar,
  onOpenSidebar,
  isSidebarOpen,
  activeTool,
  onSelectTool,
  onAction,
  onImageClick,
}: {
  isVisible: boolean;
  position?: "left" | "right";
  navPosition?: "left" | "right";
  onToggleNavPosition?: () => void;
  toolbarSettings?: ToolbarSettings;
  onAddPage?: () => void;
  isCompact?: boolean;
  onToggleSidebar?: () => void;
  onCloseSidebar?: () => void;
  onOpenSidebar?: () => void;
  isSidebarOpen?: boolean;
  activeTool?: string;
  onSelectTool?: (toolId: string) => void;
  onAction?: (action: string) => void;
  onImageClick?: () => void;
}) {
  const editor = useEditor();

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isCameraLocked, setIsCameraLocked] = useState(false);

  // Using a polling approach for simplicity as Tldraw context updates can be tricky to hook perfectly
  // for page count/index without complex listeners.
  useEffect(() => {
    if (!editor) return;

    const updateInfo = () => {
      const pages = editor.getPages();
      const currentPageId = editor.getCurrentPageId();
      const index = pages.findIndex((p: any) => p.id === currentPageId);

      setCurrentPageIndex(index !== -1 ? index : 0);
      setTotalPages(pages.length);
      setZoomLevel(Math.round(editor.getZoomLevel() * 100));
      setIsCameraLocked(editor.getCameraOptions().isLocked);
    };

    updateInfo();
    const interval = setInterval(updateInfo, 500); // Poll every 500ms
    return () => clearInterval(interval);
  }, [editor]);

  if (!isVisible || !editor) return null;

  const handleZoomIn = () => {
    const currentZoom = editor.getZoomLevel();
    const newZoom = Math.min(currentZoom + 0.05, 8); // +5%, max 800%
    editor.setCamera({ ...editor.getCamera(), z: newZoom });
  };

  const handleZoomOut = () => {
    const currentZoom = editor.getZoomLevel();
    const newZoom = Math.max(currentZoom - 0.05, 0.1); // -5%, min 10%
    editor.setCamera({ ...editor.getCamera(), z: newZoom });
  };

  const handleFitToScreen = () => {
    animateSlideToViewport(editor);
  };

  const handleNextPage = () => {
    const pages = editor.getPages();
    if (currentPageIndex < pages.length - 1) {
      editor.run(() => editor.setCurrentPage(pages[currentPageIndex + 1].id), { history: 'ignore' });
      requestAnimationFrame(() => animateSlideToViewport(editor));
    }
  };

  const handlePrevPage = () => {
    const pages = editor.getPages();
    if (currentPageIndex > 0) {
      editor.run(() => editor.setCurrentPage(pages[currentPageIndex - 1].id), { history: 'ignore' });
      requestAnimationFrame(() => animateSlideToViewport(editor));
    }
  };

  const handleSidebarClick = () => {
    console.log('[Sidebar] handleSidebarClick called', { isSidebarOpen });
    if (isSidebarOpen) {
      console.log('[Sidebar] Calling onCloseSidebar');
      onCloseSidebar?.();
    } else {
      console.log('[Sidebar] Calling onOpenSidebar');
      onOpenSidebar?.();
    }
  };

  const btnClass = `${isCompact ? "w-8 h-8" : "w-9 h-9"} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed`;
  const iconSize = isCompact ? 16 : 18;

  const MORE_TOOLS = [
    { id: 'text', label: 'Text', icon: Type },
    { id: 'note', label: 'Sticky Note', icon: StickyNote },
    { id: 'frame', label: 'Frame', icon: Frame },
    { id: 'asset', label: 'Image', icon: ImageIcon },
  ];

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      className={`fixed bottom-0 ${position === "left" ? "left-0 border-l-0 rounded-tr-2xl" : "right-0 border-r-0 rounded-tl-2xl"} bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 border-b-0 p-1 flex items-center gap-0.5 z-[99999] animate-in slide-in-from-bottom-4 fade-in duration-300`}
    >
      {position === "left" ? (
        <>
          {/* Left side: Arrow, Lock, Minimize, Close */}
          {onToggleNavPosition && (
            <button
              onClick={onToggleNavPosition}
              className={`${btnClass}`}
              title="Switch Toolbar Position"
            >
              <ChevronLeft size={iconSize} className="text-black dark:text-white" />
            </button>
          )}
          {/* More Tools Button */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => {
                setMoreMenuOpen(!moreMenuOpen);
              }}
              className={btnClass}
              title="More Tools"
            >
              <Menu size={iconSize} />
            </button>
            {moreMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-1 flex flex-col gap-1 min-w-[150px] z-[99999]">
                {MORE_TOOLS.map((tool) => {
                  const TIcon = tool.icon as React.FC<any>;
                  const isActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        if (tool.id === 'asset' && onImageClick) {
                          onImageClick();
                        } else if (onSelectTool) {
                          onSelectTool(tool.id);
                        }
                        setMoreMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-400'
                          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <TIcon size={16} />
                      {tool.label}
                    </button>
                  );
                })}
                <div className="h-px bg-gray-200 dark:bg-gray-600 my-0.5" />
                <button
                  onClick={() => { onAction?.('delete'); setMoreMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button
                  onClick={() => { onAction?.('duplicate'); setMoreMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-600 my-0.5" />
                <button
                  onClick={() => {
                    // @ts-ignore
                    if (window.electron && window.electron.ipcRenderer) {
                      // @ts-ignore
                      window.electron.ipcRenderer.invoke("minimize-app");
                    }
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Minus size={16} />
                  Minimize
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("request-close-app"));
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <X size={16} />
                  Close
                </button>
              </div>
            )}
          </div>
          {toolbarSettings?.lockPage === "nav" && (
            <button
              onClick={onAddPage}
              className={btnClass}
              title="Add Page"
            >
              <Plus size={iconSize} />
            </button>
          )}
          {(!toolbarSettings || toolbarSettings.zoomInOut === "nav") && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleZoomOut}
                className={btnClass}
                title="Zoom Out (-5%)"
              >
                <ZoomOut size={iconSize} />
              </button>
              <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center tabular-nums`}>
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className={btnClass}
                title="Zoom In (+5%)"
              >
                <ZoomIn size={iconSize} />
              </button>
            </div>
          )}
          {(!toolbarSettings || toolbarSettings.fitToScreen === "nav") && (
            <button
              onClick={handleFitToScreen}
              className={btnClass}
              title="Fit to Screen"
            >
              <Maximize size={iconSize} />
            </button>
          )}
          {toolbarSettings?.handTool === "nav" && (
            <button
              onClick={() => {
                editor.setCurrentTool("hand");
                editor.updateInstanceState({ isToolLocked: true });
              }}
              className={btnClass}
              title="Hand Tool"
            >
              <Hand size={iconSize} />
            </button>
          )}
          {(!toolbarSettings || toolbarSettings.pageNav === "nav") && (
            <div className={`flex items-center`}>
              <button
                onClick={handlePrevPage}
                disabled={currentPageIndex === 0}
                className={btnClass}
              >
                <ChevronLeft size={iconSize} />
              </button>
              {onToggleSidebar || onOpenSidebar || onCloseSidebar ? (
                <button
                  data-no-collapse
                  onClick={handleSidebarClick}
                  className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center hover:text-blue-500 dark:hover:text-blue-400 transition-colors`}
                  title={isSidebarOpen ? "Close Slides Panel" : "Open Slides Panel"}
                >
                  {currentPageIndex + 1} / {totalPages}
                </button>
              ) : (
                <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center`}>
                  {currentPageIndex + 1} / {totalPages}
                </span>
              )}
              <button
                onClick={handleNextPage}
                disabled={currentPageIndex >= totalPages - 1}
                className={btnClass}
              >
                <ChevronRight size={iconSize} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Right side: PageNav, Zoom, AddPage, Hand, Lock, Minimize, Close, Purple */}
          {(!toolbarSettings || toolbarSettings.pageNav === "nav") && (
            <div className={`flex items-center border-r border-gray-200 dark:border-gray-700 pr-1`}>
              <button
                onClick={handlePrevPage}
                disabled={currentPageIndex === 0}
                className={btnClass}
              >
                <ChevronLeft size={iconSize} />
              </button>
              {onToggleSidebar || onOpenSidebar || onCloseSidebar ? (
                <button
                  data-no-collapse
                  onClick={handleSidebarClick}
                  className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center hover:text-blue-500 dark:hover:text-blue-400 transition-colors`}
                  title={isSidebarOpen ? "Close Slides Panel" : "Open Slides Panel"}
                >
                  {currentPageIndex + 1} / {totalPages}
                </button>
              ) : (
                <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center`}>
                  {currentPageIndex + 1} / {totalPages}
                </span>
              )}
              <button
                onClick={handleNextPage}
                disabled={currentPageIndex >= totalPages - 1}
                className={btnClass}
              >
                <ChevronRight size={iconSize} />
              </button>
            </div>
          )}
          {(!toolbarSettings || toolbarSettings.zoomInOut === "nav") && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleZoomOut}
                className={btnClass}
                title="Zoom Out (-5%)"
              >
                <ZoomOut size={iconSize} />
              </button>
              <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center tabular-nums`}>
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className={btnClass}
                title="Zoom In (+5%)"
              >
                <ZoomIn size={iconSize} />
              </button>
            </div>
          )}
          {(!toolbarSettings || toolbarSettings.fitToScreen === "nav") && (
            <button
              onClick={handleFitToScreen}
              className={btnClass}
              title="Fit to Screen"
            >
              <Maximize size={iconSize} />
            </button>
          )}
          {toolbarSettings?.addPage === "nav" && onAddPage && (
            <button
              onClick={onAddPage}
              className={btnClass}
              title="Add Page"
            >
              <Plus size={iconSize} />
            </button>
          )}
          {toolbarSettings?.handTool === "nav" && (
            <button
              onClick={() => {
                editor.setCurrentTool("hand");
                editor.updateInstanceState({ isToolLocked: true });
              }}
              className={btnClass}
              title="Hand Tool"
            >
              <Hand size={iconSize} />
            </button>
          )}
          {toolbarSettings?.lockPage === "nav" && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('request-toggle-page-lock'))}
              className={`${btnClass} ${!isCameraLocked ? 'bg-rose-400 hover:bg-rose-500 text-white rounded-full shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title={isCameraLocked ? "Unlock Page" : "Lock Page"}
            >
              {isCameraLocked ? <Lock size={iconSize} /> : <Unlock size={iconSize} className={!isCameraLocked ? 'text-white' : ''} />}
            </button>
          )}
          {/* More Tools Button */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => {
                setMoreMenuOpen(!moreMenuOpen);
              }}
              className={btnClass}
              title="More Tools"
            >
              <Menu size={iconSize} />
            </button>
            {moreMenuOpen && (
              <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-1 flex flex-col gap-1 min-w-[150px] z-[99999]">
                {MORE_TOOLS.map((tool) => {
                  const TIcon = tool.icon as React.FC<any>;
                  const isActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        if (tool.id === 'asset' && onImageClick) {
                          onImageClick();
                        } else if (onSelectTool) {
                          onSelectTool(tool.id);
                        }
                        setMoreMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-400'
                          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <TIcon size={16} />
                      {tool.label}
                    </button>
                  );
                })}
                <div className="h-px bg-gray-200 dark:bg-gray-600 my-0.5" />
                <button
                  onClick={() => { onAction?.('delete'); setMoreMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button
                  onClick={() => { onAction?.('duplicate'); setMoreMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-600 my-0.5" />
                <button
                  onClick={() => {
                    // @ts-ignore
                    if (window.electron && window.electron.ipcRenderer) {
                      // @ts-ignore
                      window.electron.ipcRenderer.invoke("minimize-app");
                    }
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Minus size={16} />
                  Minimize
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("request-close-app"));
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <X size={16} />
                  Close
                </button>
              </div>
            )}
          </div>
          {onToggleNavPosition && (
            <button
              onClick={onToggleNavPosition}
              className={`${btnClass}`}
              title="Switch Toolbar Position"
            >
              <ChevronRight size={iconSize} className="text-black dark:text-white" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
