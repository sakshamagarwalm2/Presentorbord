import { useEditor } from "@tldraw/tldraw";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Plus, Hand, Lock, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
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
}: {
  isVisible: boolean;
  position?: "left" | "right";
  navPosition?: "left" | "right";
  onToggleNavPosition?: () => void;
  toolbarSettings?: ToolbarSettings;
  onAddPage?: () => void;
  isCompact?: boolean;
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
    console.log('[NavigationPanel] Fit to screen button clicked');
    if (!editor) {
      console.warn('[NavigationPanel] Editor not available in handleFitToScreen');
      return;
    }
    requestAnimationFrame(() => animateSlideToViewport(editor));
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

  const btnClass = `${isCompact ? "w-8 h-8" : "w-9 h-9"} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed`;
  const iconSize = isCompact ? 16 : 18;

  return (
    <div
      className={`fixed bottom-0 ${position === "left" ? "left-0 border-l-0 rounded-tr-2xl" : "right-0 border-r-0 rounded-tl-2xl"} bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 border-b-0 p-1 flex items-center gap-0.5 z-[99999] animate-in slide-in-from-bottom-4 fade-in duration-300`}
    >
      {position === "left" ? (
        <>
          {/* Left side: Purple, Lock, Minimize, Close */}
          {onToggleNavPosition && (
            <button
              onClick={onToggleNavPosition}
              className="w-4 h-4 bg-purple-500 hover:bg-purple-600 rounded-full transition-all hover:scale-110"
              title="Switch Toolbar Position"
            />
          )}
          <button
            onClick={() => {
              // @ts-ignore
              if (window.electron && window.electron.ipcRenderer) {
                // @ts-ignore
                window.electron.ipcRenderer.invoke("minimize-app");
              }
            }}
            className="w-4 h-4 bg-yellow-400 hover:bg-yellow-500 rounded-full transition-all hover:scale-110 ml-0.5"
            title="Minimize App"
          />
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("request-close-app"));
            }}
            className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full transition-all hover:scale-110 ml-0.5"
            title="Close App"
          />
          {toolbarSettings?.lockPage === "nav" && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('request-toggle-page-lock'))}
              className={`${btnClass} ${isCameraLocked ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : ''}`}
              title={isCameraLocked ? "Unlock Page" : "Lock Page"}
            >
              {isCameraLocked ? <Lock size={iconSize} /> : <Unlock size={iconSize} />}
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
              <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center`}>
                {currentPageIndex + 1} / {totalPages}
              </span>
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
              <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center`}>
                {currentPageIndex + 1} / {totalPages}
              </span>
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
              className={`${btnClass} ${isCameraLocked ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : ''}`}
              title={isCameraLocked ? "Unlock Page" : "Lock Page"}
            >
              {isCameraLocked ? <Lock size={iconSize} /> : <Unlock size={iconSize} />}
            </button>
          )}
          <button
            onClick={() => {
              // @ts-ignore
              if (window.electron && window.electron.ipcRenderer) {
                // @ts-ignore
                window.electron.ipcRenderer.invoke("minimize-app");
              }
            }}
            className="w-4 h-4 bg-yellow-400 hover:bg-yellow-500 rounded-full transition-all hover:scale-110 ml-0.5"
            title="Minimize App"
          />
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("request-close-app"));
            }}
            className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full transition-all hover:scale-110 ml-0.5"
            title="Close App"
          />
          {onToggleNavPosition && (
            <button
              onClick={onToggleNavPosition}
              className="w-4 h-4 bg-purple-500 hover:bg-purple-600 rounded-full transition-all hover:scale-110 ml-0.5"
              title="Switch Toolbar Position"
            />
          )}
        </>
      )}
    </div>
  );
}
