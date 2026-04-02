import { useEditor, useValue } from "@tldraw/tldraw";
import { X, LayoutGrid, Plus, Upload, Download, Copy, Trash2, FileImage, FileText, ChevronUp, ChevronDown } from "lucide-react";
import { useRef, useEffect, useState } from "react";

// Access the same thumbnail cache as Sidebar
const thumbnailCache = (window as any).thumbnailCache || {};

export function AllSlidesGrid({
  isVisible,
  onClose,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
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
  onMovePage: (fromId: string, toIndex: number) => void;
  onImport: () => void;
  onExportImage: (pageId: string) => void;
  onExportPdf: () => void;
}) {
  const editor = useEditor();
  
  // Reactive observation of pages and current page
  const pages = useValue("pages", () => editor.getPages(), [editor]);
  const currentPageId = useValue("currentPageId", () => editor.getCurrentPageId(), [editor]);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportBtnRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose]);

  // Close export menu when clicking outside
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
            <p className="text-sm text-gray-500 dark:text-gray-400">{pages.length} Slides in total</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Buttons - Reusing Sidebar Style */}
          <div className="flex items-center gap-1">
            <button
              onClick={onImport}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
              title="Import PDF/PPT"
            >
              <Upload size={18} />
            </button>
            
            <div className="relative" ref={exportBtnRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                title="Export"
              >
                <Download size={18} />
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
              onClick={() => {
                console.log("Grid: Adding page");
                onAddPage();
              }}
              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-500 transition-colors"
              title="Add Page"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => {
                console.log("Grid: Duplicating current page", currentPageId);
                onDuplicatePage(currentPageId);
              }}
              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-500 transition-colors"
              title="Duplicate Page"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={() => {
                console.log("Grid: Deleting current page", currentPageId);
                onDeletePage(currentPageId);
              }}
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
              onClick={() => {
                onSelectPage(page.id);
                onClose();
              }}
              onDuplicate={() => onDuplicatePage(page.id)}
              onDelete={() => onDeletePage(page.id)}
              onMoveUp={() => onMovePage(page.id, index - 1)}
              onMoveDown={() => onMovePage(page.id, index + 1)}
              canDelete={pages.length > 1}
              isFirst={index === 0}
              isLast={index === pages.length - 1}
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
  onClick,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canDelete,
  isFirst,
  isLast,
}: {
  page: any;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canDelete: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const editor = useEditor();

  // Find an image asset thumbnail (for PDF pages)
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

  return (
    <div
      className={`group relative flex flex-col gap-2 animate-in zoom-in-95 duration-200`}
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <div
        onClick={onClick}
        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer
          ${isSelected 
            ? "border-blue-500 ring-4 ring-blue-500/20 scale-105 z-10 shadow-xl" 
            : "border-gray-200 dark:border-gray-800 hover:border-blue-400 hover:scale-105 hover:shadow-lg dark:hover:border-blue-600"
          }
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
        
        {/* Actions Toolbar (Top right on hover) - Reusing Sidebar Styling */}
        <div className="absolute top-2 right-2 flex gap-1 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 z-20">
          {!isFirst && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              className="p-1 rounded bg-black/40 text-white hover:bg-black/60 shadow-lg backdrop-blur"
              title="Move Up"
            >
              <ChevronUp size={12} />
            </button>
          )}
          {!isLast && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              className="p-1 rounded bg-black/40 text-white hover:bg-black/60 shadow-lg backdrop-blur"
              title="Move Down"
            >
              <ChevronDown size={12} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="p-1 rounded bg-black/40 text-white hover:bg-black/60 shadow-lg backdrop-blur"
            title="Duplicate Slide"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={!canDelete}
            className={`p-1 rounded bg-red-500/70 text-white hover:bg-red-600 shadow-lg backdrop-blur 
              ${!canDelete ? "opacity-30 cursor-not-allowed" : ""}`}
            title="Delete Slide"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Slide Number Badge */}
        <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs font-bold shadow-sm transition-colors z-10
          ${isSelected ? "bg-blue-500 text-white" : "bg-black/60 text-white group-hover:bg-blue-500"}
        `}>
          Slide {index + 1}
        </div>

        {/* Selected Checkmark */}
        {isSelected && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 animate-in zoom-in-50 duration-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        )}
      </div>
      
      <span className={`text-center text-xs font-medium transition-colors truncate px-1
        ${isSelected ? "text-blue-600 dark:text-blue-400 font-bold" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500"}
      `}>
        {page.name || `Slide ${index + 1}`}
      </span>
    </div>
  );
}
