import { useEditor, useValue } from "@tldraw/tldraw";
import { X, LayoutGrid, Plus, Upload, Download, Copy, Trash2, FileImage, FileText, ChevronUp, ChevronDown, Check, Maximize } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { fitAllSlidesToViewport } from "../utils/slideCamera";

const thumbnailCache = (window as any).thumbnailCache || {};

export function AllSlidesGrid({
  isVisible,
  onClose,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onDeleteMultiple,
  onMovePage,
  onImport,
  onExportImage,
  onExportPdf,
}: {
  isVisible: boolean;
  onClose: () => void;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onDeleteMultiple: (pageIds: string[]) => void;
  onMovePage: (fromId: string, toIndex: number) => void;
  onImport: () => void;
  onExportImage: (pageId: string) => void;
  onExportPdf: () => void;
}) {
  const editor = useEditor();

  const pages = useValue("pages", () => editor.getPages(), [editor]);
  const currentPageId = useValue("currentPageId", () => editor.getCurrentPageId(), [editor]);

  const gridRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportBtnRef = useRef<HTMLDivElement>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedIds(new Set());
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, isSelectionMode, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportBtnRef.current && !exportBtnRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isVisible) return null;

  const sortedPages = [...pages].sort((a, b) => (a.index > b.index ? 1 : -1));

  const toggleSelection = (pageId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(sortedPages.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} selected slide(s)?`)) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleFitAll = () => {
    console.log('[AllSlidesGrid] Fit all slides button clicked');
    if (!editor) {
      console.warn('[AllSlidesGrid] Editor not available in handleFitAll');
      return;
    }
    fitAllSlidesToViewport(editor);
  };

  const handleDrop = (fromId: string, toIndex: number) => {
    onMovePage(fromId, toIndex);
    setDraggedId(null);
    setDropTargetIndex(null);
  };

  return (
    <div className="fixed inset-0 z-[100005] flex flex-col bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-md animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg text-white">
            <LayoutGrid size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">All Slides</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isSelectionMode
                ? `${selectedIds.size} selected`
                : `${pages.length} Slides in total`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Deselect
              </button>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedIds.size > 0
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
              >
                <Trash2 size={16} />
                Delete ({selectedIds.size})
              </button>
              <button
                onClick={exitSelectionMode}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <button
                  onClick={enterSelectionMode}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                  title="Select Multiple Slides"
                >
                  <Check size={16} />
                  Select
                </button>

                <button
                  onClick={handleFitAll}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                  title="Fit All Slides to Screen"
                >
                  <Maximize size={18} />
                </button>

                <button
                  onClick={onImport}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                  title="Import PDF/PPT"
                >
                  <Download size={18} />
                </button>

                <div className="relative" ref={exportBtnRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                    title="Export"
                  >
                    <Upload size={18} />
                  </button>

                  {showExportMenu && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100010] overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right">
                      <button
                        onClick={() => { onExportImage(currentPageId); setShowExportMenu(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3"
                      >
                        <FileImage size={16} className="text-blue-500" />
                        <span>Image (Current Page)</span>
                      </button>
                      <button
                        onClick={() => { onExportPdf(); setShowExportMenu(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700"
                      >
                        <FileText size={16} className="text-red-500" />
                        <span>Full Presentation (PDF)</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onAddPage()}
                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-500 transition-colors"
                  title="Add Page"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => onDuplicatePage(currentPageId)}
                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-500 transition-colors"
                  title="Duplicate Page"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => onDeletePage(currentPageId)}
                  disabled={pages.length <= 1}
                  className={`p-2 rounded-lg transition-colors ${pages.length <= 1 ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" : "hover:bg-red-50 text-red-500 dark:hover:bg-red-900/30"}`}
                  title="Delete Page"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-2" />

              <button
                onClick={onClose}
                className="p-2.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-all text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 active:scale-95"
                title="Close Grid View"
              >
                <X size={24} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid Content */}
      <div
        ref={gridRef}
        className="flex-1 overflow-y-auto p-6 md:p-10"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-w-[1600px] mx-auto pb-20">
          {sortedPages.map((page, index) => (
            <GridItem
              key={page.id}
              page={page}
              index={index}
              isSelected={currentPageId === page.id}
              isSelectionMode={isSelectionMode}
              isItemSelected={selectedIds.has(page.id)}
              onClick={() => {
                if (isSelectionMode) {
                  toggleSelection(page.id);
                } else {
                  onSelectPage(page.id);
                  onClose();
                }
              }}
              onToggleSelect={() => toggleSelection(page.id)}
              onDuplicate={() => onDuplicatePage(page.id)}
              onDelete={() => onDeletePage(page.id)}
              onMoveUp={() => onMovePage(page.id, index - 1)}
              onMoveDown={() => onMovePage(page.id, index + 1)}
              canDelete={pages.length > 1}
              isFirst={index === 0}
              isLast={index === pages.length - 1}
              // Drag and drop props
              isDragging={draggedId === page.id}
              isDropTarget={dropTargetIndex === index}
              onDragStart={() => setDraggedId(page.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDropTargetIndex(null);
              }}
              onDragOver={(idx) => setDropTargetIndex(idx)}
              onDrop={() => {
                if (draggedId) {
                  handleDrop(draggedId, index);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function GridItem({
  page,
  index,
  isSelected,
  isSelectionMode,
  isItemSelected,
  onClick,
  onToggleSelect,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canDelete,
  isFirst,
  isLast,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  page: any;
  index: number;
  isSelected: boolean;
  isSelectionMode: boolean;
  isItemSelected: boolean;
  onClick: () => void;
  onToggleSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canDelete: boolean;
  isFirst: boolean;
  isLast: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
}) {
  const editor = useEditor();
  const itemRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const isPointerDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const imageAssetSrc = useValue(
    `grid-thumbnail-${page.id}`,
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

  const thumbnail = (thumbnailCache[page.id]) || imageAssetSrc;

  const handleDragStart = (e: React.DragEvent) => {
    if (isSelectionMode) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", page.id);
    onDragStart();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isSelectionMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(index);
  };

  const handleNativeDrop = (e: React.DragEvent) => {
    if (isSelectionMode) return;
    e.preventDefault();
    onDrop();
  };

  // Pointer/touch drag support
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSelectionMode || e.pointerType === "mouse") return;

    // Don't start drag if clicking buttons
    if ((e.target as HTMLElement).closest('button')) return;

    startPos.current = { x: e.clientX, y: e.clientY };
    isPointerDragging.current = false;

    // Capture on currentTarget (the slide div) instead of e.target
    e.currentTarget.setPointerCapture(e.pointerId);

    // Increased to 350ms for better distinction from taps on smart boards
    longPressTimer.current = window.setTimeout(() => {
      isPointerDragging.current = true;
      onDragStart();
    }, 350);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isSelectionMode || e.pointerType === "mouse") return;
    if (!isPointerDragging.current) {
      const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
      if (dist > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      return;
    }

    // During drag, prevent default to stop scrolling
    e.preventDefault();

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const gridItem = el?.closest("[data-grid-index]");
    if (gridItem) {
      const targetIndex = parseInt(gridItem.getAttribute("data-grid-index") || "0", 10);
      onDragOver(targetIndex);
    }

    const scrollContainer = itemRef.current?.closest(".overflow-y-auto") as HTMLElement;
    if (scrollContainer) {
      const rect = scrollContainer.getBoundingClientRect();
      const scrollZone = 100;
      const scrollSpeed = 12;
      if (e.clientY < rect.top + scrollZone) {
        scrollContainer.scrollTop -= scrollSpeed;
      } else if (e.clientY > rect.bottom - scrollZone) {
        scrollContainer.scrollTop += scrollSpeed;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isSelectionMode || e.pointerType === "mouse") return;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isPointerDragging.current) {
      isPointerDragging.current = false;
      onDrop();
    }

    onDragEnd();

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {
      // Ignore capture release errors
    }
  };

  return (
    <div
      ref={itemRef}
      data-grid-index={index}
      draggable={!isSelectionMode}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleNativeDrop}
      onContextMenu={(e) => isPointerDragging.current && e.preventDefault()}
      className={`group relative flex flex-col gap-2 animate-in zoom-in-95 duration-200 
        ${isSelectionMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}
        ${isDragging ? "opacity-40 scale-95" : ""}
      `}
      style={{
        animationDelay: `${index * 20}ms`,
        touchAction: isPointerDragging.current ? 'none' : 'auto'
      }}
    >
      <div
        onClick={onClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => {
          // Prevent context menu during long press to allow drag to start
          if (longPressTimer.current || isPointerDragging.current) {
            e.preventDefault();
          }
        }}
        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300
          ${isSelectionMode
            ? isItemSelected
              ? "border-blue-500 ring-4 ring-blue-500/30 scale-105 z-10 shadow-xl"
              : "border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:scale-105"
            : isSelected
              ? "border-blue-500 ring-4 ring-blue-500/20 scale-105 z-10 shadow-xl"
              : "border-gray-200 dark:border-gray-800 hover:border-blue-400 hover:scale-105 hover:shadow-lg dark:hover:border-blue-600"
          }
          ${isDropTarget && !isDragging ? "ring-4 ring-blue-400 border-blue-400" : ""}
        `}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            className="w-full h-full object-contain bg-white dark:bg-gray-900"
            alt={`Slide ${index + 1}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-3xl">
            📄
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors" />

        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer z-20
              ${isItemSelected
                ? "bg-blue-500 text-white"
                : "bg-white/90 dark:bg-gray-800/90 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400"
              }`}
          >
            {isItemSelected && <Check size={14} strokeWidth={3} />}
          </div>
        )}

        {/* Actions Toolbar (Top right on hover) */}
        {!isSelectionMode && (
          <div className="absolute top-2 right-2 flex gap-1 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 z-20">
            {!isFirst && (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                className="p-1.5 rounded bg-black/50 text-white hover:bg-black/70 shadow-lg backdrop-blur flex items-center justify-center min-w-[24px] min-h-[24px]"
                title="Move Backward"
              >
                <ChevronUp size={14} />
              </button>
            )}
            {!isLast && (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                className="p-1.5 rounded bg-black/50 text-white hover:bg-black/70 shadow-lg backdrop-blur flex items-center justify-center min-w-[24px] min-h-[24px]"
                title="Move Forward"
              >
                <ChevronDown size={14} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="p-1.5 rounded bg-black/50 text-white hover:bg-black/70 shadow-lg backdrop-blur flex items-center justify-center min-w-[24px] min-h-[24px]"
              title="Duplicate Slide"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={!canDelete}
              className={`p-1.5 rounded bg-red-500/70 text-white hover:bg-red-600 shadow-lg backdrop-blur flex items-center justify-center min-w-[24px] min-h-[24px]
                ${!canDelete ? "opacity-30 cursor-not-allowed" : ""}`}
              title="Delete Slide"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Slide Number Badge */}
        <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs font-bold shadow-sm transition-colors z-10
          ${isSelected && !isSelectionMode ? "bg-blue-500 text-white" : "bg-black/60 text-white group-hover:bg-blue-500"}
        `}>
          {index + 1}
        </div>
      </div>

      <span className={`text-center text-xs font-medium transition-colors truncate px-1
        ${isSelected && !isSelectionMode ? "text-blue-600 dark:text-blue-400 font-bold" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500"}
      `}>
        {page.name || `Slide ${index + 1}`}
      </span>
    </div>
  );
}
