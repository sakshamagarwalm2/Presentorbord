import {
  Tldraw,
  useEditor,
  AssetRecordType,
  createShapeId,
  PageRecordType,
  TLComponents,
  TLUiOverrides,
  getIndexAbove,
  ZERO_INDEX_KEY,
  DefaultColorStyle,
} from "@tldraw/tldraw";
console.log("!!! APP.TSX FILE LOADED !!!");
import "@tldraw/tldraw/tldraw.css";
import { tauriApi } from "./tauri-api"
import { fitSlideToViewport, animateSlideToViewport } from "./utils/slideCamera";

import { useSubjectMode } from "./store/useSubjectMode";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useGeometrySnapping } from "./utils/useGeometrySnapping";

import { Sidebar } from "./components/Sidebar";
import { ToolsSidebar, ToolbarSettings } from "./components/ToolsSidebar";
import { DrawingToolbar } from "./components/DrawingToolbar";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { NavigationPanel } from "./components/NavigationPanel";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { PageSelectionDialog } from "./components/PageSelectionDialog";
import { AllSlidesGrid } from "./components/AllSlidesGrid";
import { TimerWidget } from "./components/TimerWidget";
import { SelectionBoxIcons } from "./components/SelectionBoxIcons";
import { LassoSelectionForeground } from "./components/LassoSelectionForeground";
import { jsPDF } from "jspdf";
import { ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { GraphAxes1ShapeUtil } from "./shapes/graph/GraphAxes1ShapeUtil";
import { GraphAxes4ShapeUtil } from "./shapes/graph/GraphAxes4ShapeUtil";

import { CustomDrawShapeUtil } from "./shapes/CustomDrawShapeUtil";
import { SuperPenShapeUtil } from "./shapes/SuperPenShapeUtil";
import { EmojiPenShapeUtil } from "./shapes/EmojiPenShapeUtil";
import { CustomLineShapeUtil } from "./shapes/CustomLineShapeUtil";
import { CustomDottedLineShapeUtil } from "./shapes/CustomDottedLineShapeUtil";
import { RightAngledTriangleShapeUtil } from "./shapes/RightAngledTriangleShapeUtil";
import { CircleShapeUtil } from "./shapes/CircleShapeUtil";
import { ParallelogramShapeUtil } from "./shapes/ParallelogramShapeUtil";
import { CustomArrowShapeUtil } from "./shapes/CustomArrowShapeUtil";

import { CustomLaserTool } from "./tools/CustomLaserTool";
import { GraphAxes1Tool } from "./tools/GraphAxes1Tool";
import { GraphAxes4Tool } from "./tools/GraphAxes4Tool";
import { LassoTool } from "./tools/LassoTool";
import { SuperPenTool } from "./tools/SuperPenTool";
import { EmojiPenTool } from "./tools/EmojiPenTool";
import { PrecisionEraserTool } from "./tools/PrecisionEraserTool";
import { AreaEraserTool } from "./tools/AreaEraserTool";
import { LineTool } from "./tools/LineTool";
import { DottedLineTool } from "./tools/DottedLineTool";
import { RightAngledTriangleTool } from "./tools/RightAngledTriangleTool";
import { CircleTool } from "./tools/CircleTool";
import { ParallelogramTool } from "./tools/ParallelogramTool";
import { CustomArrowTool } from "./tools/CustomArrowTool";

const customShapeUtils = [
  GraphAxes1ShapeUtil,
  GraphAxes4ShapeUtil,
  CustomDrawShapeUtil,
  SuperPenShapeUtil,
  EmojiPenShapeUtil,
  CustomLineShapeUtil,
  CustomDottedLineShapeUtil,
  RightAngledTriangleShapeUtil,
  CircleShapeUtil,
  ParallelogramShapeUtil,
  CustomArrowShapeUtil,
];
const customTools = [
  CustomLaserTool,
  GraphAxes1Tool,
  GraphAxes4Tool,
  LassoTool,
  SuperPenTool,
  EmojiPenTool,
  PrecisionEraserTool,
  AreaEraserTool,
  LineTool,
  DottedLineTool,
  RightAngledTriangleTool,
  CircleTool,
  ParallelogramTool,
  CustomArrowTool,
];
import {
  currentThicknessSignal,
  currentOpacitySignal,
  currentIsBrushSignal,
  currentBrushTypeSignal,
  currentCustomColorSignal,
} from "./store/styleSignals";
import { getNearestNamedColor } from "./utils/colorUtils";

const SHAPE_TYPES_TO_AUTO_SELECT = new Set([
  "geo",
  "arrow",
  "line",
  "custom-line",
  "custom-dotted-line",
  "custom-right-triangle",
  "custom-circle",
  "custom-parallelogram",
  "custom-arrow",
  "graph-axes-1",
  "graph-axes-4",
  "text",
  "note",
  "frame",
  "protractor",
  "ruler",
]);

const NATIVE_COLOR_SHAPE_TYPES = new Set([
  "geo",
  "arrow",
  "line",
  "text",
  "note",
  "frame",
]);

// Context Menu Overrides
// Moved into App component to use useMemo

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

function AppContent() {
  const editor = useEditor();
  const { width } = useWindowSize();
  useGeometrySnapping(editor);
  const { mode } = useSubjectMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, _setImportProgress] = useState("");
  const [importedFileBaseName, setImportedFileBaseName] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Prevent browser context menu globally
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      console.log("[AppContent] Right-click detected at:", { x: e.clientX, y: e.clientY });
      // We prevent default to block the browser's menu
      e.preventDefault(); 
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // Poll zoom level and page info
  useEffect(() => {
    const updateInfo = () => {
      setZoomLevel(Math.round(editor.getZoomLevel() * 100));
      const pages = editor.getPages();
      const currentPageId = editor.getCurrentPageId();
      const index = pages.findIndex((p: any) => p.id === currentPageId);
      setCurrentPageIndex(index !== -1 ? index : 0);
      setTotalPages(pages.length);
    };
    updateInfo();
    const interval = setInterval(updateInfo, 500);
    return () => clearInterval(interval);
  }, [editor]);

  const handleZoomIn = () => {
    const currentZoom = editor.getZoomLevel();
    const newZoom = Math.min(currentZoom + 0.05, 8);
    editor.setCamera({ ...editor.getCamera(), z: newZoom });
  };

  const handleZoomOut = () => {
    const currentZoom = editor.getZoomLevel();
    const newZoom = Math.max(currentZoom - 0.05, 0.1);
    editor.setCamera({ ...editor.getCamera(), z: newZoom });
  };

  const handleFitToScreen = () => {
    requestAnimationFrame(() => animateSlideToViewport(editor));
  };

  const handlePrevPage = () => {
    const pages = editor.getPages();
    if (currentPageIndex > 0) {
      editor.run(() => editor.setCurrentPage(pages[currentPageIndex - 1].id), { history: 'ignore' });
      requestAnimationFrame(() => animateSlideToViewport(editor));
    }
  };

  const handleNextPage = () => {
    const pages = editor.getPages();
    if (currentPageIndex < pages.length - 1) {
      editor.run(() => editor.setCurrentPage(pages[currentPageIndex + 1].id), { history: 'ignore' });
      requestAnimationFrame(() => animateSlideToViewport(editor));
    }
  };

  // Set dark mode as default on first mount
  useEffect(() => {
    editor.user.updateUserPreferences({ colorScheme: "dark" });
    editor.setStyleForNextShapes(DefaultColorStyle, getNearestNamedColor(currentCustomColorSignal.get()));
    editor.setCurrentTool('lasso');
    editor.updateInstanceState({ isToolLocked: true });
  }, [editor]);

  const setImportProgress = (msg: string) => {
    tauriApi.log(`[Import Progress] ${msg}`);
    _setImportProgress(msg);
  };

  // Copy to Slide Dialog State
  const [copyDialogVisible, setCopyDialogVisible] = useState(false);
  const [copyCandidateShapeIds, setCopyCandidateShapeIds] = useState<string[]>(
    [],
  );

  // Custom confirm dialog state
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

  const showConfirmDialog = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmDialogVisible(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setConfirmDialogVisible(false);
    confirmResolverRef.current?.(true);
    confirmResolverRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setConfirmDialogVisible(false);
    confirmResolverRef.current?.(false);
    confirmResolverRef.current = null;
  }, []);

  // Listen for custom copy request event from context menu
  useEffect(() => {
    const handleCopyRequest = (e: any) => {
      const shapeIds = e.detail?.shapeIds;
      if (shapeIds && shapeIds.length > 0) {
        setCopyCandidateShapeIds(shapeIds);
        setCopyDialogVisible(true);
      }
    };

    window.addEventListener("request-copy-to-slide", handleCopyRequest);
    return () =>
      window.removeEventListener("request-copy-to-slide", handleCopyRequest);
  }, []);

  const handleTogglePageLock = useCallback(() => {
    const isCameraLocked = editor.getCameraOptions().isLocked;
    const newLockedState = !isCameraLocked;

    // 1. Toggle Camera
    editor.setCameraOptions({ isLocked: newLockedState });

    // 2. Lock/Unlock ALL slides' backgrounds
    const allPages = editor.getPages();
    
    for (const page of allPages) {
      const shapeIds = editor.getSortedChildIdsForParent(page.id);
      let backgroundShape = shapeIds
        .map((id: any) => editor.getShape(id))
        .find((s: any) => s.meta?.isPageBackground);

      // Fallback: largest image on the page
      if (!backgroundShape) {
        const images = shapeIds
          .map((id: any) => editor.getShape(id))
          .filter((s: any) => s.type === "image");

        if (images.length > 0) {
          backgroundShape = images.sort(
            (a: any, b: any) => b.props.w * b.props.h - a.props.w * a.props.h,
          )[0];
        }
      }

      if (backgroundShape) {
        editor.updateShape({
          ...backgroundShape,
          isLocked: newLockedState,
          meta: newLockedState
            ? { ...backgroundShape.meta, isPageBackground: true }
            : backgroundShape.meta,
        });
      }
    }
  }, [editor]);

  // Listen for custom toggle page lock event from context menu
  useEffect(() => {
    const handleToggleLockRequest = () => {
      handleTogglePageLock();
    };

    window.addEventListener(
      "request-toggle-page-lock",
      handleToggleLockRequest,
    );
    return () =>
      window.removeEventListener(
        "request-toggle-page-lock",
        handleToggleLockRequest,
      );
  }, [handleTogglePageLock]);

  const handleCopyShapesToPage = (targetPageId: string) => {
    setCopyDialogVisible(false);

    if (copyCandidateShapeIds.length === 0) return;

    const shapes = copyCandidateShapeIds
      .map((id) => editor.getShape(id as any))
      .filter(Boolean);
    if (shapes.length === 0) return;

    // 1. Get the target page
    // 2. Clone shapes to that page
    // 3. Optional: Navigate to that page or show success toast

    editor.run(() => {
      shapes.forEach((shape) => {
        if (!shape) return;
        // Create a clone on the target page
        // We keep the same X/Y coordinates
        const { id: _id, parentId: _parentId, ...props } = shape as any;

        editor.createShape({
          ...props,
          id: createShapeId(), // Generate new ID
          parentId: targetPageId as any, // Set new parent (page)
        });
      });
    });

    // Optional: Show a quick feedback? For now, we just close the dialog.
    // We could verify by checking if shapes exist on target page, but manual verification covers this.
  };

  useEffect(() => {
    // Expose signals for external components
    (window as any).currentThicknessSignal = currentThicknessSignal;
    (window as any).currentOpacitySignal = currentOpacitySignal;
    (window as any).currentIsBrushSignal = currentIsBrushSignal;
    (window as any).currentBrushTypeSignal = currentBrushTypeSignal;

    // Inject current thickness and opacity into new draw shapes
    const cleanupThickness = editor.sideEffects.registerBeforeCreateHandler(
      "shape",
      (shape) => {
        if (shape.type === "draw") {
          const thickness = currentThicknessSignal.get();
          const opacity = currentOpacitySignal.get();
          const isBrush = currentIsBrushSignal.get();
          const brushType = currentBrushTypeSignal.get();

          const toolName = isBrush ? `Brush (${brushType})` : "Standard Pen/Pencil";
          tauriApi.log(`[Drawing] New Stroke Created: ${toolName} | Thickness: ${thickness} | Opacity: ${opacity}`);

          return {
            ...shape,
            type: "custom-draw",
            opacity,
            meta: {
              ...shape.meta,
              thickness,
              isBrush,
              brushType,
            },
          };
        }

        if (shape.type === "super-pen") {
            const props = (shape as any).props;
            tauriApi.log(`[Drawing] New Super Pen Created: ${props.mode} | Size: ${props.size} | Opacity: ${props.opacity}`);
        }

        if (shape.type === "custom-laser") {
            tauriApi.log(`[Drawing] New Laser Pointer active`);
        }

        if (shape.type === "graph-axes-1" || shape.type === "graph-axes-4") {
          const color = currentCustomColorSignal.get() || "#ffffff";
          const thickness = currentThicknessSignal.get() || 2;
          console.log(`[App] Creating Graph: Type=${shape.type}, Color=${color}, Thickness=${thickness}`)
          return {
            ...shape,
            props: {
              ...shape.props,
              color,
            },
            meta: {
              ...shape.meta,
              thickness,
            }
          }
        }

        if (NATIVE_COLOR_SHAPE_TYPES.has(shape.type) && "color" in ((shape as any).props ?? {})) {
          const color = currentCustomColorSignal.get() || "#ffffff";
          const namedColor = getNearestNamedColor(color);
          console.log(`[App] Creating Native Shape: Type=${shape.type}, SelectedColor=${color}, MappedColor=${namedColor}`);

          return {
            ...shape,
            props: {
              ...shape.props,
              color: namedColor,
            },
            meta: {
              ...shape.meta,
              selectedHexColor: color,
            },
          };
        }

        console.log(`[App] Creating Shape: Type=${shape.type}, PropsColor=${(shape.props as any)?.color}`)
        return shape;
      },
    );

    // Automatically select newly created shapes after the user finishes dragging (Pointer Up)
    let lastCreatedShapeId: any = null;

    const cleanupAutoSelect = editor.sideEffects.registerAfterCreateHandler(
      "shape",
      (shape) => {
        const currentTool = editor.getCurrentToolId();

        // If a geometric shape is created and we're not in select mode, track it
        // We MUST ignore guide shapes (used by arrow/line tools) as they are deleted on pointer up
        if (
          SHAPE_TYPES_TO_AUTO_SELECT.has(shape.type) && 
          currentTool !== 'select' &&
          currentTool !== 'lasso' &&
          !shape.meta?.isPageBackground &&
          !shape.meta?.isGuide
        ) {
          lastCreatedShapeId = shape.id;
        }
      }
    );

    // Listen for mouse release on window to finalize selection (more robust than editor.on)
    const handlePointerUp = () => {
      if (lastCreatedShapeId) {
        const shapeId = lastCreatedShapeId;
        lastCreatedShapeId = null; // Clear immediately to avoid double-triggers

        setTimeout(() => {
          if (editor.getShape(shapeId)) {
            editor.setCurrentTool('lasso');
            editor.updateInstanceState({ isToolLocked: true });
          }
        }, 50); // Small delay to let the drawing tool finish its state transition
      }
    };

    window.addEventListener('pointerup', handlePointerUp);

    // Log major store changes
    const unsubStore = editor.store.listen((entry) => {
      const changes = entry.changes;
      const added = Object.keys(changes.added).length;
      const updated = Object.keys(changes.updated).length;
      const removed = Object.keys(changes.removed).length;

      if (added > 0 || updated > 0 || removed > 0) {
        // We don't log every single tiny move to avoid flooding,
        // but we log when multiple things happen or major additions
        if (added > 5 || updated > 20 || removed > 5) {
          tauriApi.log(`Store Change: Added ${added}, Updated ${updated}, Removed ${removed}`);
        }
      }
    });

    // Guard: prevent deletion of page-level image shapes (PDF slide backgrounds)
    const cleanup = editor.sideEffects.registerBeforeDeleteHandler(
      "shape",
      (shape) => {
        // If a shape is a page-level image AND is locked, prevent its deletion
        // We check for the explicit meta flag AND lock status
        if (shape.meta?.isPageBackground && shape.isLocked) {
          return false; // Prevent deletion of locked background
        }
        return; // Allow deletion
      },
    );

    // Retroactively tag any existing page-level images as backgrounds (but don't lock them)
    // This acts as a migration for existing projects
    const pages = editor.getPages();
    for (const page of pages) {
      const shapeIds = editor.getSortedChildIdsForParent(page.id);
      for (const id of shapeIds) {
        const shape = editor.getShape(id);
        // Heuristic: It's a background if it's an image, direct child of page,
        // and positioned at 0,0 (typical for imports)
        if (shape && shape.type === "image") {
          const looksLikeBackground = (shape.x === 0 && shape.y === 0);

          if (looksLikeBackground && !shape.meta?.isPageBackground) {
            // Apply meta tagging only, keep unlocked
            editor.updateShape({
              id: shape.id,
              type: shape.type,
              meta: { ...shape.meta, isPageBackground: true },
            });
          }
        }
      }
    }

    return () => {
      cleanupThickness();
      cleanupAutoSelect();
      window.removeEventListener('pointerup', handlePointerUp);
      unsubStore();
      cleanup();
    };
  }, [editor]);

  const projectInputRef = useRef<HTMLInputElement>(null);

  // Check if there is any existing content in the editor
  const hasExistingContent = (): boolean => {
    const pages = editor.getPages();
    // If there's more than one page, there's content
    if (pages.length > 1) return true;
    // Check if the single page has any shapes
    const shapeIds = editor.getSortedChildIdsForParent(pages[0].id);
    return shapeIds.length > 0;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProject = async () => {
    const snapshot = editor.store.getSnapshot();
    const blob = new Blob([JSON.stringify(snapshot)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project.tldr";
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleOpenProject = () => {
    projectInputRef.current?.click();
  };

  const handleProjectFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Confirm before replacing existing project
    if (hasExistingContent()) {
      const confirmed = await showConfirmDialog();
      if (!confirmed) {
        if (projectInputRef.current) projectInputRef.current.value = "";
        return;
      }
    }

    const text = await file.text();
    try {
      const snapshot = JSON.parse(text);
      editor.loadSnapshot(snapshot);
    } catch (e) {
      console.error("Failed to load project", e);
      alert("Failed to load project file");
    }

    // Reset input
    if (projectInputRef.current) projectInputRef.current.value = "";
  };

  const [importModeDialogVisible, setImportModeDialogVisible] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);

  const handleImportModeReplace = () => {
    setImportModeDialogVisible(false);
    const file = pendingImportFile;
    setPendingImportFile(null);
    if (file) handleSlideImport(file, 'replace');
  };

  const handleImportModeAppend = () => {
    setImportModeDialogVisible(false);
    const file = pendingImportFile;
    setPendingImportFile(null);
    if (file) handleSlideImport(file, 'append');
  };

  const handleImportModeCancel = () => {
    setImportModeDialogVisible(false);
    setPendingImportFile(null);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isSlideFile =
      file.type === "application/pdf" ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".ppt") ||
      file.name.endsWith(".pptx");

    if (isSlideFile) {
      setPendingImportFile(file);
      setImportModeDialogVisible(true);
    } else {
      await handleImageImport(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageImport = async (file: File) => {
    setIsImporting(true);
    setImportProgress(`Importing image: ${file.name}`);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      const blobUrl = URL.createObjectURL(blob);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = blobUrl;
      });

      const naturalW = img.width;
      const naturalH = img.height;
      const maxW = 800;
      const displayW = Math.min(naturalW, maxW);
      const displayH = (naturalH / naturalW) * displayW;

      const canvas = document.createElement("canvas");
      canvas.width = displayW;
      canvas.height = displayH;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, displayW, displayH);
      const dataUrl = canvas.toDataURL(file.type || "image/png");

      URL.revokeObjectURL(blobUrl);

      const assetId = AssetRecordType.createId();
      editor.run(() => {
        editor.batch(() => {
          editor.createAssets([{
            id: assetId,
            typeName: "asset",
            type: "image",
            meta: {},
            props: {
              name: file.name,
              src: dataUrl,
              w: displayW,
              h: displayH,
              mimeType: file.type || "image/png",
              isAnimated: false,
            },
          }]);

          const viewportCenter = editor.getViewportScreenCenter();
          editor.createShape({
            type: "image",
            x: viewportCenter.x - displayW / 2,
            y: viewportCenter.y - displayH / 2,
            props: {
              assetId,
              w: displayW,
              h: displayH,
            },
            meta: {},
          });
        });
      }, { history: 'ignore' });

      tauriApi.log(`[Image Import] Imported ${file.name} (${naturalW}x${naturalH}) at ${displayW}x${displayH}`);
    } catch (error: any) {
      tauriApi.log(`[Image Import] Failed: ${error?.message || error}`);
      alert("Image import failed: " + (error?.message || error));
    } finally {
      setIsImporting(false);
      setImportProgress("");
    }
  };

  const handleSlideImport = async (file: File, importMode: 'replace' | 'append') => {
    const importStartTime = performance.now();
    setIsImporting(true);
    setImportProgress("Unlocking all pages...");

    // Unlock all pages before importing
    const allPages = editor.getPages();
    for (const page of allPages) {
      const shapeIds = editor.getSortedChildIdsForParent(page.id);
      for (const shapeId of shapeIds) {
        const shape = editor.getShape(shapeId);
        if (shape && shape.isLocked) {
          editor.updateShape({ ...shape, isLocked: false });
        }
      }
    }

    // Also unlock camera
    editor.setCameraOptions({ isLocked: false });

    setImportProgress("Reading file...");

    try {
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isPptx = file.name.endsWith(".pptx") || file.name.endsWith(".ppt");
      const fileBaseName = file.name.replace(/\.(pdf|pptx?)$/i, "");
      setImportedFileBaseName(fileBaseName);

      if (!isPdf && !isPptx) {
        alert("Unsupported file format. Please use PDF or PPTX files.");
        return;
      }

      setImportProgress(`Reading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`);

      let slideImages: { url: string; w: number; h: number }[] = [];
      let pageCount = 0;

      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfData = new Uint8Array(arrayBuffer);
        tauriApi.log(`PDF file read: ${(file.size / 1024 / 1024).toFixed(1)}MB`);

        try {
          tauriApi.saveImportedFile(Array.from(pdfData), file.name).catch(() => {});
        } catch (_) { /* non-critical */ }

        setImportProgress("Loading PDF engine...");
        const { loadPdf, renderPageToSlideDataUrl } = await import("./utils/pdfUtils");
        const pdf = await loadPdf(pdfData, { verbose: true, timeout: 120000 });
        pageCount = pdf.numPages;
        tauriApi.log(`[Import] Parsed ${pageCount} PDF pages`);

        for (let i = 1; i <= pageCount; i++) {
          setImportProgress(`Rendering slide ${i} of ${pageCount}...`);
          const slide = await renderPageToSlideDataUrl(pdf, i);
          slideImages.push(slide);
        }
      } else {
        setImportProgress("Extracting PPTX slides...");
        const { extractPptxSlides } = await import("./utils/pptxUtils");
        const arrayBuffer = await file.arrayBuffer();
        slideImages = await extractPptxSlides(arrayBuffer);
        pageCount = slideImages.length;
        tauriApi.log(`[Import] Extracted ${pageCount} PPTX slides`);
      }

      if (pageCount === 0) {
        alert("No slides found in the file.");
        return;
      }

      if (importMode === 'replace') {
        setImportProgress("Clearing existing slides...");
        editor.run(() => {
          editor.batch(() => {
            const existingPages = editor.getPages();
            const firstPageId = existingPages[0]?.id;

            if (firstPageId) {
              editor.setCurrentPage(firstPageId);
              const shapeIds = editor.getSortedChildIdsForParent(firstPageId);
              if (shapeIds.length > 0) {
                for (const id of shapeIds) {
                  const shape = editor.getShape(id);
                  if (shape && shape.isLocked) {
                    editor.updateShape({ id: shape.id, type: shape.type, isLocked: false });
                  }
                }
                editor.deleteShapes(shapeIds);
              }
              editor.renamePage(firstPageId, "Slide 1");
            }

            for (let i = existingPages.length - 1; i >= 0; i--) {
              if (existingPages[i].id !== firstPageId) {
                editor.deletePage(existingPages[i].id);
              }
            }

            const existingAssets = editor.getAssets();
            if (existingAssets.length > 0) {
              editor.deleteAssets(existingAssets.map((a) => a.id));
            }
          });
        }, { history: 'ignore' });
      }

      const existingPages = editor.getPages();
      const sortedExisting = [...existingPages].sort((a, b) => (a.index > b.index ? 1 : -1));
      const firstExistingPageId = existingPages[0]?.id;
      const lastExistingPage = sortedExisting[sortedExisting.length - 1];

      function generatePageIndices(count: number, startAfter?: string): any[] {
        const indices: any[] = [];
        let currentIndex: any = startAfter || ZERO_INDEX_KEY;
        for (let i = 0; i < count; i++) {
          currentIndex = getIndexAbove(currentIndex);
          indices.push(currentIndex);
        }
        return indices;
      }

      const pageIndices = generatePageIndices(pageCount, lastExistingPage?.index);

      const newPageIds: string[] = [];

      await editor.run(async () => {
        editor.batch(() => {
          if (importMode === 'replace' && firstExistingPageId) {
            editor.updatePage({ id: firstExistingPageId, index: pageIndices[0] });
            editor.renamePage(firstExistingPageId, "Slide 1");
            newPageIds.push(firstExistingPageId);
            
            for (let i = 1; i < pageCount; i++) {
              const newPageId = PageRecordType.createId();
              editor.createPage({
                id: newPageId,
                name: `Slide ${i + 1}`,
                index: pageIndices[i],
              });
              newPageIds.push(newPageId);
            }
          } else {
            for (let i = 0; i < pageCount; i++) {
              const newPageId = PageRecordType.createId();
              editor.createPage({
                id: newPageId,
                name: `Slide ${sortedExisting.length + i + 1}`,
                index: pageIndices[i],
              });
              newPageIds.push(newPageId);
            }
          }
        });

        for (let i = 0; i < slideImages.length; i++) {
          const { url, w, h } = slideImages[i];
          const pageId = newPageIds[i];

          if (!url) {
            tauriApi.log(`[Import] Skipping empty slide ${i + 1}`);
            continue;
          }

          try {
            editor.batch(() => {
              const assetId = AssetRecordType.createId();
              editor.createAssets([{
                id: assetId,
                typeName: "asset",
                type: "image",
                meta: {},
                props: {
                  name: `slide-${i + 1}`,
                  src: url,
                  w,
                  h,
                  mimeType: "image/jpeg",
                  isAnimated: false,
                },
              }]);

          editor.createShape({
            type: "image",
            parentId: pageId as any,
            x: 0,
            y: 0,
            isLocked: false,
            props: {
              assetId,
              w,
              h,
            },
            meta: {
              isPageBackground: true,
            },
          });
            });
          } catch (renderError) {
            tauriApi.log(`[Import] ERROR on slide ${i + 1}: ${renderError}`);
          }

          if (i % 5 === 0) {
            setImportProgress(`Adding slides ${i + 1}-${Math.min(i + 5, pageCount)} of ${pageCount}...`);
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
        }
      }, { history: 'ignore' });

      // Automatically optimize each page's view in the background
      // This is done outside editor.run to ensure camera side-effects and UI updates process correctly
      const allPages = [...editor.getPages()].sort((a, b) => (a.index > b.index ? 1 : -1));
      for (let i = 0; i < allPages.length; i++) {
        const page = allPages[i];
        setImportProgress(`Optimizing view for slide ${i + 1} of ${allPages.length}...`);
        
        // Switch to the page
        editor.setCurrentPage(page.id);
        
        // Give tldraw and the browser a small window to layout and stabilize the view
        await new Promise(resolve => setTimeout(resolve, 60));
        
        // Fit to screen (instant)
        fitSlideToViewport(editor);
      }

      // Return to the first page when done
      if (allPages.length > 0) {
        editor.setCurrentPage(allPages[0].id);
        // Ensure the first page is also correctly fitted
        await new Promise(resolve => setTimeout(resolve, 30));
        fitSlideToViewport(editor);
      }

      tauriApi.log(`[Import] Completed in ${((performance.now() - importStartTime) / 1000).toFixed(2)}s`);
    } catch (error: any) {
      tauriApi.log(`[Import] Failed: ${error?.message || error}`);
      alert("Import failed: " + (error?.message || error));
    } finally {
      setIsImporting(false);
      setImportProgress("");
    }
  };

  const [showNavPanel, setShowNavPanel] = useState(true);
  const [navPosition, setNavPosition] = useState<"left" | "right">("right");
  const [showRecentColors, setShowRecentColors] = useState(true);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const defaultToolbarSettings: ToolbarSettings = {
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

  const [toolbarSettings, setToolbarSettings] = useState<ToolbarSettings>(() => {
    const saved = localStorage.getItem("toolbar-settings");
    if (saved) {
      try {
        return { ...defaultToolbarSettings, ...JSON.parse(saved) };
      } catch {
        return defaultToolbarSettings;
      }
    }
    return defaultToolbarSettings;
  });

  const handleToolbarSettingsChange = (newSettings: ToolbarSettings) => {
    setToolbarSettings(newSettings);
    localStorage.setItem("toolbar-settings", JSON.stringify(newSettings));
  };

  const [exitDialogVisible, setExitDialogVisible] = useState(false);
  const [isAllSlidesGridVisible, setIsAllSlidesGridVisible] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgressExport] = useState("");

  const addPage = useCallback(() => {
    const pages = editor.getPages();
    const sortedPages = pages.sort((a, b) => (a.index > b.index ? 1 : -1));
    const currentPageId = editor.getCurrentPageId();
    const newPageId = PageRecordType.createId();

    const currentIndex = sortedPages.findIndex((p) => p.id === currentPageId);
    let newIndex: string;
    if (currentIndex >= 0 && currentIndex < sortedPages.length - 1) {
      const curr = sortedPages[currentIndex].index;
      const next = sortedPages[currentIndex + 1].index;
      newIndex = curr.slice(0, -1) + String.fromCharCode(curr.charCodeAt(curr.length - 1) + 1);
      if (newIndex >= next) newIndex = curr + "V";
    } else {
      const last = sortedPages[sortedPages.length - 1]?.index || "a0";
      newIndex = last + "V";
    }

    editor.run(() => {
      editor.createPage({
        id: newPageId,
        name: `Page ${pages.length + 1}`,
        index: newIndex as any,
      });
      editor.setCurrentPage(newPageId);
    }, { history: 'ignore' });
    requestAnimationFrame(() => editor.zoomToFit());
  }, [editor]);

  // Listen for custom add page event from context menu
  useEffect(() => {
    const handleAddPageRequest = () => {
      addPage();
    };

    window.addEventListener("request-add-page", handleAddPageRequest);
    return () =>
      window.removeEventListener("request-add-page", handleAddPageRequest);
  }, [addPage]);

  const deletePage = useCallback((id: string) => {
    const pages = editor.getPages();
    if (pages.length <= 1) return;
    editor.run(() => {
      editor.deletePage(id as any);
    }, { history: 'ignore' });
    const thumbnailCache = (window as any).thumbnailCache;
    if (thumbnailCache) delete thumbnailCache[id];
  }, [editor]);

  const duplicatePage = useCallback(async (targetPageId?: string) => {
    const pages = editor.getPages();
    const sortedPages = pages.sort((a, b) => (a.index > b.index ? 1 : -1));
    const pageIdToDuplicate = targetPageId || editor.getCurrentPageId();
    
    // Gather shapes and their data
    const shapeIds = Array.from(editor.getSortedChildIdsForParent(pageIdToDuplicate as any));
    const shapeData = shapeIds.map((id) => editor.getShape(id)).filter(Boolean);

    const newPageId = PageRecordType.createId();
    const currentIdx = sortedPages.findIndex((p) => p.id === pageIdToDuplicate);
    
    let newIndex: string;
    if (currentIdx >= 0 && currentIdx < sortedPages.length - 1) {
      newIndex = sortedPages[currentIdx].index + "V";
    } else {
      const last = sortedPages[sortedPages.length - 1]?.index || "a0";
      newIndex = last + "V";
    }

    editor.run(() => {
      editor.createPage({
        id: newPageId,
        name: `Page ${pages.length + 1}`,
        index: newIndex as any,
      });

      editor.setCurrentPage(newPageId);

      for (const shape of shapeData) {
        if (!shape) continue;
        const { id: _oldId, parentId: _oldParent, ...rest } = shape as any;
        editor.createShape({
          ...rest,
          parentId: newPageId as any,
        });
      }
    }, { history: 'ignore' });

    requestAnimationFrame(() =>
      requestAnimationFrame(() => fitSlideToViewport(editor))
    );
  }, [editor]);
  const handleMovePage = useCallback((fromId: string, toIndex: number) => {
    const pages = editor.getPages();
    const sortedPages = pages.sort((a, b) => (a.index > b.index ? 1 : -1));
    const fromIndex = sortedPages.findIndex((p) => p.id === fromId);
    if (fromIndex === -1 || fromIndex === toIndex) return;

    const movingPage = sortedPages[fromIndex];
    const reordered = [...sortedPages];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movingPage);

    editor.run(() => {
      editor.batch(() => {
        for (let i = 0; i < reordered.length; i++) {
          const original = sortedPages[i];
          const moved = reordered[i];
          if (original.id !== moved.id) {
            editor.updatePage({ id: moved.id, index: original.index });
          }
        }
      });
    }, { history: 'ignore' });
  }, [editor]);

  const handleExportImage = useCallback(async (targetPageId?: string) => {
    const pageId = targetPageId || editor.getCurrentPageId();
    const shapeIds = Array.from(editor.getSortedChildIdsForParent(pageId as any));
    if (shapeIds.length === 0) return alert("Page is empty");

    setIsExporting(true);
    setExportProgressExport("Generating image...");

    try {
      const svg = await editor.getSvg(shapeIds);
      if (!svg) throw new Error("Could not generate SVG");

      const imageString = await new Promise<string>((resolve, reject) => {
        const svgString = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
      });

      const downloadLink = document.createElement("a");
      downloadLink.href = imageString;
      downloadLink.download = `page-${pageId}.png`;
      downloadLink.click();
    } catch (e) {
      console.error(e);
      alert("Export failed");
    } finally {
      setIsExporting(false);
      setExportProgressExport("");
    }
  }, [editor]);

  const handleExportPdf = useCallback(async () => {
    const pages = editor.getPages();
    if (!pages.length) return;
    const sortedPages = [...pages].sort((a, b) => (a.index > b.index ? 1 : -1));

    setIsExporting(true);
    setExportProgressExport("Initializing PDF export...");

    const originalPageId = editor.getCurrentPageId();

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1920, 1080],
        compress: true,
      });

      for (let i = 0; i < sortedPages.length; i++) {
        const page = sortedPages[i];
        setExportProgressExport(`Processing page ${i + 1} of ${sortedPages.length}...`);
        editor.setCurrentPage(page.id);
        await new Promise((resolve) => setTimeout(resolve, 500));

        const shapeIds = Array.from(editor.getCurrentPageShapeIds());
        if (shapeIds.length === 0) {
          if (i > 0) doc.addPage([1920, 1080], "landscape");
          continue;
        }

        const isDarkMode = document.documentElement.classList.contains("dark") || 
                           document.documentElement.classList.contains("tl-theme__dark") || 
                           editor.user.getIsDarkMode();

        const svg = await editor.getSvg(shapeIds, {
          scale: 1,
          background: false,
          padding: 0,
          darkMode: isDarkMode,
        });

        if (svg) {
          const { dataUrl } = await new Promise<{ dataUrl: string }>((resolve, reject) => {
            const svgString = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            canvas.width = 1920;
            canvas.height = 1080;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("No context");

            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const img = new Image();
            img.onload = () => {
              const svgWidth = parseFloat(svg.getAttribute("width") || "1920");
              const svgHeight = parseFloat(svg.getAttribute("height") || "1080");
              const scale = Math.min(1920 / svgWidth, 1080 / svgHeight);
              const destWidth = svgWidth * scale;
              const destHeight = svgHeight * scale;
              ctx.drawImage(img, 0, 0, svgWidth, svgHeight, (1920 - destWidth) / 2, (1080 - destHeight) / 2, destWidth, destHeight);
              resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.8) });
            };
            img.onerror = reject;
            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
          });

          if (i > 0) doc.addPage([1920, 1080], "landscape");
          doc.addImage(dataUrl, "JPEG", 0, 0, 1920, 1080);
        }
      }
      doc.save(importedFileBaseName ? `${importedFileBaseName}_presenter.pdf` : "presentation.pdf");
    } catch (e) {
      console.error("PDF Export Error", e);
      alert("PDF Export failed: " + e);
    } finally {
      editor.setCurrentPage(originalPageId);
      setIsExporting(false);
      setExportProgressExport("");
    }
  }, [editor]);

  useEffect(() => {
    const handleCloseAppRequest = () => {
      setExitDialogVisible(true);
    };
    window.addEventListener("request-close-app", handleCloseAppRequest);
    return () =>
      window.removeEventListener("request-close-app", handleCloseAppRequest);
  }, []);

  const handleCloseExitWithoutSaving = () => {
    tauriApi.closeApp();
  };

  const handleCloseCancel = () => {
    setExitDialogVisible(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        tauriApi.openLogDir();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Collapse both sidebars when clicking outside of them (on the workspace)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If the click is inside a sidebar, do nothing
      if (target.closest("[data-sidebar]")) return;
      // If the click is on any UI overlay (toolbar, nav panel, etc.), do nothing
      if (target.closest("[data-no-collapse]")) return;
      // Otherwise, collapse both sidebars
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    };
    // Use capture phase so we get the event before tldraw stops propagation
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  // Keyboard listener for presentation remotes (PageUp/PageDown)
  useEffect(() => {
    const handlePresentationKeys = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const pages = editor.getPages();
      const sortedPages = [...pages].sort((a, b) => (a.index > b.index ? 1 : -1));
      const currentPageId = editor.getCurrentPageId();
      const currentIndex = sortedPages.findIndex((p) => p.id === currentPageId);

      // Top Button (often F5 or b) -> Select Super Pen
      if (e.key === "F5" || e.key === "b" || e.key === "B") {
        e.preventDefault();
        editor.setCurrentTool("super-pen");
        editor.updateInstanceState({ isToolLocked: true });
        tauriApi.log("[Remote] Top Button pressed: Selecting Super Pen");
        return;
      }

      // Bottom Button (often . or Escape or Esc) -> Select Precision Eraser
      if (e.key === "." || e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        editor.setCurrentTool("precision-eraser");
        editor.updateInstanceState({ isToolLocked: true });
        tauriApi.log("[Remote] Bottom Button pressed: Selecting Precision Eraser");
        return;
      }

      if (e.key === "PageDown" || e.key === "ArrowRight") {
        if (currentIndex < sortedPages.length - 1) {
          e.preventDefault();
          editor.run(() => editor.setCurrentPage(sortedPages[currentIndex + 1].id), { history: 'ignore' });
          requestAnimationFrame(() => animateSlideToViewport(editor));
        }
      } else if (e.key === "PageUp" || e.key === "ArrowLeft") {
        if (currentIndex > 0) {
          e.preventDefault();
          editor.run(() => editor.setCurrentPage(sortedPages[currentIndex - 1].id), { history: 'ignore' });
          requestAnimationFrame(() => animateSlideToViewport(editor));
        }
      }
    };

    window.addEventListener("keydown", handlePresentationKeys);
    return () => window.removeEventListener("keydown", handlePresentationKeys);
  }, [editor]);

  // ResizeObserver to re-fit slides when window resizes
  useEffect(() => {
    if (!editor) return;

    const container = document.querySelector('.tldraw__editor');
    if (!container) return;

    let debounce: ReturnType<typeof setTimeout>;

    const observer = new ResizeObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        requestAnimationFrame(() => fitSlideToViewport(editor));
      }, 150);
    });

    observer.observe(container);

    return () => {
      clearTimeout(debounce);
      observer.disconnect();
    };
  }, [editor]);

  return (
    <>
      <Sidebar
        onImport={handleImportClick}
        isOpen={leftSidebarOpen}
        onToggle={setLeftSidebarOpen}
        onShowAllSlides={() => setIsAllSlidesGridVisible(true)}
        addPage={addPage}
        deletePage={deletePage}
        duplicatePage={duplicatePage}
        handleExportImage={handleExportImage}
        handleExportPdf={handleExportPdf}
        side={navPosition === "right" ? "left" : "right"}
      />
      <ToolsSidebar
        onImportClick={handleImportClick}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        showNavPanel={showNavPanel}
        onToggleNavPanel={() => setShowNavPanel(!showNavPanel)}
        showRecentColors={showRecentColors}
        onToggleRecentColors={() => setShowRecentColors(!showRecentColors)}
        isOpen={rightSidebarOpen}
        onToggle={setRightSidebarOpen}
        toolbarSettings={toolbarSettings}
        onToolbarSettingsChange={handleToolbarSettingsChange}
        onOpenTimer={() => setShowTimer(true)}
        side={navPosition === "right" ? "right" : "left"}
      />
      <DrawingToolbar 
        showRecentColors={showRecentColors} 
        onImageClick={handleImportClick} 
        onAddPage={addPage}
        toolbarSettings={toolbarSettings}
        isCompact={width < 1100}
        style={width < 1100 && showNavPanel ? { transform: `translateX(${navPosition === 'right' ? '-80px' : 'calc(-50% + 80px)'})` } : undefined}
      />
      <NavigationPanel 
        isVisible={showNavPanel} 
        position={navPosition}
        onToggleNavPosition={() => setNavPosition(navPosition === "right" ? "left" : "right")}
        toolbarSettings={toolbarSettings}
        onAddPage={addPage}
        isCompact={width < 1100}
        onToggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onOpenSidebar={() => setLeftSidebarOpen(true)}
        onCloseSidebar={() => setLeftSidebarOpen(false)}
        isSidebarOpen={leftSidebarOpen}
        activeTool={editor?.getCurrentToolId()}
        onSelectTool={(toolId) => editor?.setCurrentTool(toolId)}
        onAction={(action) => {
          if (action === 'delete') {
            editor?.deleteShapes(editor?.getSelectedShapeIds() || []);
          } else if (action === 'duplicate') {
            editor?.duplicateShapes(editor?.getSelectedShapeIds() || []);
          } else if (action === 'lock') {
            const shapes = editor?.getSelectedShapes() || [];
            editor?.updateShapes(shapes.map(shape => ({ ...shape, isLocked: true })));
          } else if (action === 'unlock-all') {
            const currentPageId = editor?.getCurrentPageId();
            if (currentPageId) {
              const shapeIds = editor?.getSortedChildIdsForParent(currentPageId) || [];
              const shapesToUnlock = shapeIds
                .map(id => editor?.getShape(id))
                .filter(s => s && (s as any).isLocked);
              if (shapesToUnlock.length > 0) {
                editor?.updateShapes(shapesToUnlock.map((shape: any) => ({
                  id: shape.id,
                  type: shape.type,
                  isLocked: false
                })));
              }
            }
          }
        }}
        onImageClick={handleImportClick}
      />
      {showNavPanel && (
        <div
          className={`fixed bottom-0 ${navPosition === "right" ? "left-0 border-l-0 rounded-tr-2xl" : "right-0 border-r-0 rounded-tl-2xl"} bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 border-b-0 ${width < 1100 ? 'p-1' : 'p-1.5'} z-[99999] flex items-center gap-0.5 animate-in slide-in-from-bottom-4 fade-in duration-300`}
        >
          {navPosition === "left" ? (
            <>
              {/* Left side: PageNav, Plus, Zoom, Purple */}
              {(toolbarSettings?.pageNav === "main") && (
                <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPageIndex === 0}
                    className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft size={width < 1100 ? 16 : 18} />
                  </button>
                  <button
                    data-no-collapse
                    onClick={() => { console.log('[App] Page nav button clicked - panel is on: RIGHT side of screen (main toolbar, opposite to nav panel)'); leftSidebarOpen ? setLeftSidebarOpen(false) : setLeftSidebarOpen(true); }}
                    className={`${width < 1100 ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center hover:text-blue-500 dark:hover:text-blue-400 transition-colors`}
                    title={leftSidebarOpen ? "Close Slides Panel" : "Open Slides Panel"}
                  >
                    {currentPageIndex + 1} / {totalPages}
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPageIndex >= totalPages - 1}
                    className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <ChevronRight size={width < 1100 ? 16 : 18} />
                  </button>
                </div>
              )}
              {(toolbarSettings?.addPage === "main") && addPage && (
                <button
                  onClick={addPage}
                  className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400`}
                  title="Add Page"
                >
                  <Plus size={width < 1100 ? 16 : 18} />
                </button>
              )}
              {(toolbarSettings?.zoomInOut === "main") && (
                <div className="flex items-center">
                  <button
                    onClick={handleZoomOut}
                    className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400`}
                    title="Zoom Out (-5%)"
                  >
                    <ZoomOut size={width < 1100 ? 16 : 18} />
                  </button>
                  <span className={`${width < 1100 ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center tabular-nums`}>
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400`}
                    title="Zoom In (+5%)"
                  >
                    <ZoomIn size={width < 1100 ? 16 : 18} />
                  </button>
                  {(toolbarSettings?.fitToScreen === "main") && (
                    <button
                      onClick={handleFitToScreen}
                      className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400`}
                      title="Fit to Screen"
                    >
                      <Maximize size={width < 1100 ? 16 : 18} />
                    </button>
                  )}
                </div>
              )}
              <div className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center`}>
                <button
                  onClick={() => setNavPosition("right")}
                  className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`}
                  title="Switch Toolbar Position"
                >
                  <ChevronRight size={width < 1100 ? 16 : 18} className="text-black dark:text-white" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Right side: Arrow, Zoom, Plus, PageNav */}
              <div className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center`}>
                <button
                  onClick={() => setNavPosition("left")}
                  className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`}
                  title="Switch Toolbar Position"
                >
                  <ChevronLeft size={width < 1100 ? 16 : 18} className="text-black dark:text-white" />
                </button>
              </div>
              {(toolbarSettings?.zoomInOut === "main") && (
                <>
                  <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-1">
                    <button
                      onClick={handleZoomOut}
                      className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400`}
                      title="Zoom Out (-5%)"
                    >
                      <ZoomOut size={width < 1100 ? 16 : 18} />
                    </button>
                    <span className={`${width < 1100 ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center tabular-nums`}>
                      {zoomLevel}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400`}
                      title="Zoom In (+5%)"
                    >
                      <ZoomIn size={width < 1100 ? 16 : 18} />
                    </button>
                    {(toolbarSettings?.fitToScreen === "main") && (
                      <button
                        onClick={handleFitToScreen}
                        className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400`}
                        title="Fit to Screen"
                      >
                        <Maximize size={width < 1100 ? 16 : 18} />
                      </button>
                    )}
                  </div>
                </>
              )}
              {(toolbarSettings?.addPage === "main") && addPage && (
                <button
                  onClick={addPage}
                  className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400`}
                  title="Add Page"
                >
                  <Plus size={width < 1100 ? 16 : 18} />
                </button>
              )}
              {(toolbarSettings?.pageNav === "main") && (
                <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-1">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPageIndex === 0}
                    className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft size={width < 1100 ? 16 : 18} />
                  </button>
                  <button
                    data-no-collapse
                    onClick={() => { console.log('[App] Page nav button clicked - panel is on: LEFT side of screen (main toolbar, opposite to nav panel)'); leftSidebarOpen ? setLeftSidebarOpen(false) : setLeftSidebarOpen(true); }}
                    className={`${width < 1100 ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center hover:text-blue-500 dark:hover:text-blue-400 transition-colors`}
                    title={leftSidebarOpen ? "Close Slides Panel" : "Open Slides Panel"}
                  >
                    {currentPageIndex + 1} / {totalPages}
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPageIndex >= totalPages - 1}
                    className={`${width < 1100 ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <ChevronRight size={width < 1100 ? 16 : 18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg"
        onChange={handleFileChange}
      />

      <input
        type="file"
        ref={projectInputRef}
        className="hidden"
        accept=".tldr,.json"
        onChange={handleProjectFileChange}
      />
      <LoadingOverlay
        isVisible={isImporting || isExporting}
        message={isImporting ? "Importing File" : "Exporting..."}
        subMessage={importProgress || exportProgress || "Please wait..."}
      />
      {importModeDialogVisible && (
        <div className="fixed inset-0 z-[100010] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleImportModeCancel} />
          <div className="relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 w-[440px] border border-gray-200/50 dark:border-gray-700/50 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Import Slides
            </h3>
            <p className="text-base text-gray-500 dark:text-gray-400 mb-8">
              How would you like to import these slides?
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleImportModeReplace}
                className="group w-full px-6 py-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-semibold transition-all duration-200 text-left shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg">Replace All</div>
                    <div className="text-sm font-normal opacity-80 mt-1">Delete existing slides and start fresh</div>
                  </div>
                  <svg className="w-6 h-6 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
              <button
                onClick={handleImportModeAppend}
                className="group w-full px-6 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-semibold transition-all duration-200 text-left shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg">Append</div>
                    <div className="text-sm font-normal opacity-80 mt-1">Add after existing slides</div>
                  </div>
                  <svg className="w-6 h-6 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              <button
                onClick={handleImportModeCancel}
                className="w-full px-6 py-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors text-center mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        isVisible={confirmDialogVisible}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <ConfirmDialog
        isVisible={exitDialogVisible}
        title="Confirm Close"
        message="Please make sure you have saved your work before closing. Any unsaved changes will be lost."
        confirmLabel="Close"
        onConfirm={handleCloseExitWithoutSaving}
        cancelLabel="Cancel"
        onCancel={handleCloseCancel}
      />
      <PageSelectionDialog
        isVisible={copyDialogVisible}
        onClose={() => setCopyDialogVisible(false)}
        onConfirm={handleCopyShapesToPage}
        pages={editor.getPages()}
        currentPageId={editor.getCurrentPageId()}
      />
      <AllSlidesGrid
        isVisible={isAllSlidesGridVisible}
        onClose={() => setIsAllSlidesGridVisible(false)}
        onSelectPage={(id) => {
          editor.run(() => {
            editor.setCurrentPage(id as any);
          }, { history: 'ignore' });
          requestAnimationFrame(() =>
            requestAnimationFrame(() => fitSlideToViewport(editor))
          );
        }}
        onAddPage={addPage}
        onDuplicatePage={duplicatePage}
        onDeletePage={deletePage}
        onDeleteMultiple={(ids) => {
          const pages = editor.getPages();
          
          for (const id of ids) {
            if (pages.length > 1) {
              deletePage(id);
            }
          }
        }}
        onMovePage={handleMovePage}
        onImport={() => {
          setIsAllSlidesGridVisible(false);
          setTimeout(() => handleImportClick(), 100);
        }}
        onExportImage={handleExportImage}
        onExportPdf={handleExportPdf}
      />
      {showTimer && (
        <TimerWidget onClose={() => setShowTimer(false)} />
      )}
      <SelectionBoxIcons />
    </>
  );
}

const components: TLComponents = {
  DebugPanel: null,
  NavigationPanel: null,
  PageMenu: null,
  MainMenu: null,
  StylePanel: null,
  Toolbar: null,
  QuickActions: null,
  HelperButtons: null,
  SelectionForeground: LassoSelectionForeground,
};

// Define overrides outside to be sure they are stable
const overrides: TLUiOverrides = {
  actions: (editor, actions) => {
    console.log("!!! ACTIONS OVERRIDE HIT !!!");
    
    actions["copy-annotations-custom"] = {
      id: "copy-annotations-custom",
      label: "Copy",
      onSelect: () => {
        const selectedShapes = editor.getSelectedShapes();
        const annotations = selectedShapes.filter((s: any) => s.type !== "image");
        localStorage.setItem("annotation-clipboard", JSON.stringify(annotations));
        window.dispatchEvent(new Event('storage'));
        alert("Annotations copied!");
      },
    };

    actions["unlock-all-custom"] = {
      id: "unlock-all-custom",
      label: "Unlock All",
      onSelect: () => {
        const shapes = editor.getSortedChildIdsForParent(editor.getCurrentPageId())
          .map(id => editor.getShape(id))
          .filter((s: any) => s && s.isLocked && !s.meta?.isPageBackground);
        editor.updateShapes(shapes.map((s: any) => ({ ...s, isLocked: false })));
        alert("All annotations unlocked!");
      },
    };

    return actions;
  },
  contextMenu: (editor, schema, helpers) => {
    console.log("!!! CONTEXT MENU OVERRIDE HIT !!!", schema);
    
    // Completely replace the menu
    return [
      {
        id: "custom-group",
        type: "group",
        checkbox: false,
        disabled: false,
        readonlyOk: true,
        children: [
          {
            id: "copy-item",
            type: "item",
            readonlyOk: false,
            disabled: false,
            actionItem: helpers.actions["copy-annotations-custom"]
          },
          {
            id: "unlock-item",
            type: "item",
            readonlyOk: false,
            disabled: false,
            actionItem: helpers.actions["unlock-all-custom"]
          }
        ]
      }
    ];
  },
};

function App(): JSX.Element {
  console.log("[App] Rendering");

  return (
    <div className="tldraw__editor" style={{ position: "fixed", inset: 0 }}>
      <Tldraw
        shapeUtils={customShapeUtils}
        tools={customTools}
        components={components}
        overrides={[overrides]}
        options={{ maxPages: 700 }}
        onMount={(editor) => {
          console.log("[Tldraw] Mounted - setting up resize debug");
          
          // Track resize state changes
          editor.on('change', (change) => {
            if (change.source === 'user') {
              const isResizing = editor.getInstanceState().isResizing;
              console.log(`[Tldraw] change: type=${change.type}, isResizing=${isResizing}`);
            }
          });
          
          // Track selection changes
          editor.on('change', (change) => {
            if (change.type === 'selection') {
              console.log(`[Tldraw] Selection changed:`, {
                selected: editor.getSelectedShapeIds(),
                isResizing: editor.getInstanceState().isResizing,
              });
            }
          });
        }}
      >
        <AppContent />
      </Tldraw>
    </div>
  );
}

export default App;
