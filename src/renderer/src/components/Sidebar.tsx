import { useEditor, useValue } from "@tldraw/tldraw";
import {
  Plus,
  Trash2,
  Download,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Copy,
  Upload,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Maximize,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { fitSlideToViewport, fitAllSlidesToViewport } from "../utils/slideCamera";

// Global thumbnail cache so it persists across re-renders
const thumbnailCache: Record<string, string> = {};
(window as any).thumbnailCache = thumbnailCache;

export function Sidebar({
  onImport,
  isOpen,
  onToggle,
  onShowAllSlides,
  addPage,
  deletePage,
  duplicatePage,
  handleExportImage,
  handleExportPdf,
  side = "left",
}: {
  onImport: () => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onShowAllSlides: () => void;
  addPage: () => void;
  deletePage: (id: string) => void;
  duplicatePage: () => void;
  handleExportImage: () => void;
  handleExportPdf: () => void;
  side?: "left" | "right";
}) {
  const editor = useEditor();
  const pages = useValue("pages", () => {
    return editor.getPages();
  }, [editor]);
  const currentPageId = useValue(
    "currentPageId",
    () => editor.getCurrentPageId(),
    [editor],
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [, forceUpdate] = useState(0);
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current slide when sidebar opens
  useEffect(() => {
    if (isOpen && currentPageId && pagesContainerRef.current) {
      const selectedElement = pagesContainerRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isOpen, currentPageId]);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportBtnRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportBtnRef.current &&
        !exportBtnRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedPages = pages.sort((a, b) => (a.index > b.index ? 1 : -1));

  // Capture thumbnail of current page's content
  const captureThumbnail = useCallback(async () => {
    try {
      const pageId = editor.getCurrentPageId();
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (shapeIds.length === 0) {
        delete thumbnailCache[pageId];
        forceUpdate((n) => n + 1);
        return;
      }
      const svg = await editor.getSvg(shapeIds);
      if (!svg) return;

      const svgString = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const maxW = 400;
        const scale = Math.min(maxW / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        thumbnailCache[pageId] = canvas.toDataURL("image/png");
        forceUpdate((n) => n + 1);
      };
      img.src =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgString)));
    } catch (_e) {
      // Silently fail
    }
  }, [editor]);

  // Capture thumbnail periodically for current page
  useEffect(() => {
    captureThumbnail();
    const interval = setInterval(captureThumbnail, 3000);
    return () => clearInterval(interval);
  }, [captureThumbnail, currentPageId]);

  const onAddPage = () => {
    captureThumbnail();
    addPage();
  };

  const onDeletePage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePage(id);
  };

  const deleteCurrentPage = () => {
    deletePage(currentPageId);
  };

  const onDuplicatePage = async () => {
    captureThumbnail();
    duplicatePage();
  };

  const selectPage = (id: string) => {
    captureThumbnail();
    const pageId = id as any;
    editor.run(() => editor.setCurrentPage(pageId), { history: 'ignore' });
    requestAnimationFrame(() => fitSlideToViewport(editor));
  };

  const handleFitAll = () => {
    console.log('[Sidebar] Fit all slides button clicked');
    if (!editor) {
      console.warn('[Sidebar] Editor not available in handleFitAll');
      return;
    }
    fitAllSlidesToViewport(editor);
  };

  const handleDrop = useCallback(
    (fromId: string, toIndex: number) => {
      const fromIndex = sortedPages.findIndex((p) => p.id === fromId);
      if (fromIndex === -1 || fromIndex === toIndex) return;

      const movingPage = sortedPages[fromIndex];
      const reordered = [...sortedPages];
      reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, movingPage);

      for (let i = 0; i < reordered.length; i++) {
        const original = sortedPages[i];
        const moved = reordered[i];
        if (original.id !== moved.id) {
          editor.updatePage({ id: moved.id, index: original.index });
        }
      }
    },
    [sortedPages, editor],
  );

  const onExportImage = () => {
    setShowExportMenu(false);
    handleExportImage();
  };

  const onExportPdf = () => {
    setShowExportMenu(false);
    handleExportPdf();
  };

  return (
    <>
      {!isOpen && (
        <button
          data-sidebar
          onClick={() => onToggle(true)}
          className={`absolute ${side === 'left' ? 'left-3' : 'right-3'} top-3 z-[99999] p-1.5 bg-gradient-to-r from-orange-400 to-pink-500 backdrop-blur-md rounded-lg hover:from-orange-300 hover:to-pink-400 transition-all shadow-lg shadow-orange-500/30`}
          title="Expand Sidebar"
        >
          {side === 'left' ? (
            <ChevronRight
              size={16}
              className="text-white drop-shadow-md"
            />
          ) : (
            <ChevronLeft
              size={16}
              className="text-white drop-shadow-md"
            />
          )}
        </button>
      )}

      <div
        data-sidebar
        className={`absolute top-0 ${side === 'left' ? 'left-0' : 'right-0'} bottom-0 z-[99998] transform transition-all duration-300 ${isOpen ? "translate-x-0 opacity-100" : (side === 'left' ? "-translate-x-96" : "translate-x-96") + " opacity-0 pointer-events-none"}`}
      >
        <div className="w-72 h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg flex flex-col">
          <div className="px-2 py-2 flex justify-between items-center">
            <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
              Pages
            </h2>
            <div className="flex gap-1 items-center">
              <button
                onClick={onShowAllSlides}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                title="Show All Slides (Grid View)"
              >
                <LayoutGrid size={14} />
              </button>

              <button
                onClick={handleFitAll}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                title="Fit All Slides to Screen"
              >
                <Maximize size={14} />
              </button>

              <button
                onClick={onImport}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                title="Import PDF/PPT"
              >
                <Download size={14} />
              </button>

              <div className="relative" ref={exportBtnRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                  title="Export"
                >
                  <Upload size={14} />
                </button>
                {showExportMenu && (
                  <div className={`absolute top-full ${side === 'left' ? 'left-0' : 'right-0'} mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-[100000] overflow-hidden`}>
                    <button
                      onClick={onExportImage}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                    >
                      <span>Image (Current Page)</span>
                    </button>
                    <button
                      onClick={onExportPdf}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                    >
                      <span>PDF (All Pages)</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onAddPage}
                className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"
                title="Add Page"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={onDuplicatePage}
                className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"
                title="Duplicate Page"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={deleteCurrentPage}
                disabled={pages.length <= 1}
                className={`p-1.5 rounded-lg transition-colors ${pages.length <= 1 ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" : "hover:bg-red-50 text-red-500 dark:hover:bg-red-900/30"}`}
                title="Delete Page"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => onToggle(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
                title="Collapse"
              >
                {side === 'left' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>
          </div>

          <div
            ref={pagesContainerRef}
            className="sidebar-pages flex-1 overflow-y-auto p-2 space-y-0.5"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(249, 115, 22, 0.5) transparent",
            }}
          >
            <div>
              {sortedPages.map((page, i) => (
                <PageItem
                  key={page.id}
                  page={page}
                  isSelected={currentPageId === page.id}
                  onClick={() => selectPage(page.id)}
                  onDelete={onDeletePage}
                  index={i}
                  isDragging={draggedId === page.id}
                  isDropTarget={dropTargetIndex === i}
                  onDragStart={() => setDraggedId(page.id)}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDropTargetIndex(null);
                  }}
                  onDragOver={(idx: number) => setDropTargetIndex(idx)}
                  onDrop={() => {
                    if (draggedId && dropTargetIndex !== null) {
                      handleDrop(draggedId, dropTargetIndex);
                    }
                    setDraggedId(null);
                    setDropTargetIndex(null);
                  }}
                  isFirst={i === 0}
                  isLast={i === sortedPages.length - 1}
                  onMoveUp={(e) => {
                    e.stopPropagation();
                    if (i > 0) handleDrop(page.id, i - 1);
                  }}
                  onMoveDown={(e) => {
                    e.stopPropagation();
                    if (i < sortedPages.length - 1) handleDrop(page.id, i + 1);
                  }}
                  cachedThumbnail={thumbnailCache[page.id] || null}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PageItem({
  page,
  isSelected,
  onClick,
  onDelete,
  index,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  cachedThumbnail,
}: {
  page: any;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (e: React.MouseEvent) => void;
  onMoveDown: (e: React.MouseEvent) => void;
  cachedThumbnail: string | null;
}) {
  const editor = useEditor();
  const itemRef = useRef<HTMLDivElement>(null);
  const isStylusDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const imageAssetSrc = useValue(
    `thumbnail-${page.id}`,
    () => {
      const shapeIds = editor.getSortedChildIdsForParent(page.id);
      for (const id of shapeIds) {
        const shape = editor.getShape(id);
        if (shape && shape.type === "image" && "assetId" in shape.props) {
          const props = shape.props as any;
          const asset = editor.getAsset(props.assetId) as any;
          if (asset && asset.props.src) return asset.props.src;
        }
      }
      return null;
    },
    [editor, page.id],
  );

  const thumbnail = cachedThumbnail || imageAssetSrc;
  const slideNumber = index + 1;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle left click/primary pointer
    if (e.button !== 0) return;
    
    e.stopPropagation(); // Prevent triggering selection on the parent container

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isStylusDragging.current = true;
    
    console.log(`[Sidebar] Drag STARTED via Handle (${e.pointerType})`);
    
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    
    onDragStart();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isStylusDragging.current) return;

    // If we are dragging, prevent default behavior
    if (e.cancelable) e.preventDefault();

    // Find what's under the pointer
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const pageItem = el?.closest("[data-page-index]");
    if (pageItem) {
      const targetIndex = parseInt(pageItem.getAttribute("data-page-index") || "0", 10);
      onDragOver(targetIndex);
    }

    // Handle auto-scrolling the sidebar
    const scrollContainer = itemRef.current?.closest(".sidebar-pages") as HTMLElement;
    if (scrollContainer) {
      const rect = scrollContainer.getBoundingClientRect();
      const scrollZone = 60;
      const scrollSpeed = 10;
      if (e.clientY < rect.top + scrollZone) {
        scrollContainer.scrollTop -= scrollSpeed;
      } else if (e.clientY > rect.bottom - scrollZone) {
        scrollContainer.scrollTop += scrollSpeed;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isStylusDragging.current) {
      isStylusDragging.current = false;
      console.log(`[Sidebar] Drag DROPPED (${e.pointerType})`);
      onDrop();
      e.stopPropagation();
    }

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (isStylusDragging.current) {
      console.log(`[Sidebar] Drag CANCELLED (${e.pointerType})`);
      isStylusDragging.current = false;
      onDragEnd();
    }
    
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  return (
    <div
      ref={itemRef}
      data-page-index={index}
      data-selected={isSelected}
      onClick={onClick}
      className={`group relative transition-all overflow-hidden
                ${isDragging ? "opacity-40 scale-95" : "cursor-pointer"}
                ${isDropTarget && !isDragging ? "ring-4 ring-orange-400 ring-offset-2 dark:ring-offset-gray-900" : ""}
                ${isSelected ? "border-2 border-orange-500 ring-4 ring-orange-500/30 scale-[1.02] shadow-xl shadow-orange-500/20 dark:shadow-orange-500/10 z-10" : "hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600"}
            `}
      style={{
        touchAction: 'pan-y', // Allow vertical scrolling on the slide item
        userSelect: 'none'
      }}
    >
      {isDropTarget && !isDragging && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500 z-10" />
      )}

      {thumbnail ? (
        <div className="w-full aspect-video bg-white dark:bg-gray-700">
          <img
            src={thumbnail}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>
      ) : (
        <div
          className={`w-full aspect-video flex items-center justify-center ${isSelected ? "bg-orange-50 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-800"}`}
        >
          <span className="text-2xl">📄</span>
        </div>
      )}

      <div
        className={`absolute top-1 left-1 min-w-[20px] h-5 flex items-center justify-center rounded text-[10px] font-bold px-1 ${isSelected ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40" : "bg-black/50 text-white"}`}
      >
        {slideNumber}
      </div>

      <div
        className={`absolute top-1 right-1 flex gap-1 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        {!isFirst && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(e); }}
            className="p-1 rounded bg-black/50 text-white hover:bg-black/70 flex items-center justify-center min-w-[20px] min-h-[20px]"
            title="Move Up"
          >
            <ChevronUp size={14} />
          </button>
        )}
        {!isLast && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(e); }}
            className="p-1 rounded bg-black/50 text-white hover:bg-black/70 flex items-center justify-center min-w-[20px] min-h-[20px]"
            title="Move Down"
          >
            <ChevronDown size={14} />
          </button>
        )}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="p-1 rounded bg-black/50 text-white cursor-grab active:cursor-grabbing flex items-center justify-center min-w-[20px] min-h-[20px]"
          style={{ touchAction: 'none' }} // Crucial: handle is exclusively for dragging
        >
          <GripVertical size={14} />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(page.id, e); }}
          className="p-1 rounded bg-red-500/70 text-white hover:bg-red-500 flex items-center justify-center min-w-[20px] min-h-[20px]"
          title="Delete Page"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
