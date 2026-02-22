import {
  Tldraw,
  useEditor,
  AssetRecordType,
  createShapeId,
  PageRecordType,
  TLComponents,
  TLUiOverrides,
} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

import { useSubjectMode } from "./store/useSubjectMode";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadPdf, renderPageToDataURL } from "./utils/pdfUtils";
import { useGeometrySnapping } from "./utils/useGeometrySnapping";

import { Sidebar } from "./components/Sidebar";
import { ToolsSidebar } from "./components/ToolsSidebar";
import { DrawingToolbar } from "./components/DrawingToolbar";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { NavigationPanel } from "./components/NavigationPanel";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { PageSelectionDialog } from "./components/PageSelectionDialog";

import { GraphAxes1ShapeUtil } from "./shapes/graph/GraphAxes1ShapeUtil";
import { GraphAxes4ShapeUtil } from "./shapes/graph/GraphAxes4ShapeUtil";
import { RulerShapeUtil } from "./shapes/ruler/RulerShapeUtil";
import { ProtractorShapeUtil } from "./shapes/protractor/ProtractorShapeUtil";
import { CompassShapeUtil } from "./shapes/compass/CompassShapeUtil";

import { CustomLaserTool } from "./tools/CustomLaserTool";
import { GraphAxes1Tool } from "./tools/GraphAxes1Tool";
import { GraphAxes4Tool } from "./tools/GraphAxes4Tool";
import { LassoTool } from "./tools/LassoTool";

const customShapeUtils = [
  GraphAxes1ShapeUtil,
  GraphAxes4ShapeUtil,
  RulerShapeUtil,
  ProtractorShapeUtil,
  CompassShapeUtil,
];
const customTools = [
  CustomLaserTool,
  GraphAxes1Tool,
  GraphAxes4Tool,
  LassoTool,
];

// Context Menu Overrides
const overrides: TLUiOverrides = {
  // @ts-ignore - contextMenu might not be in the type definition but is supported
  contextMenu: (editor: any, contextMenu: any, { actions }: any) => {
    const selectedShapes = editor.getSelectedShapes();

    // Filter out images (PDF slides and imported images)
    const copyableShapes = selectedShapes.filter(
      (shape: any) => shape.type !== "image",
    );

    // Only show if we have copyable shapes selected
    if (copyableShapes.length === 0) return contextMenu;

    const copyToSlideAction = {
      id: "copy-to-slide",
      label: "Copy to Slide",
      readonlyOk: false,
      onSelect: () => {
        // Dispatch custom event to notify App component
        window.dispatchEvent(
          new CustomEvent("request-copy-to-slide", {
            detail: { shapeIds: copyableShapes.map((s: any) => s.id) },
          }),
        );
      },
    };

    // Insert at the beginning or specific position

    const lockSelectedAction = {
      id: "lock-selected",
      label: "Lock Selected",
      readonlyOk: false,
      onSelect: () => {
        editor.updateShapes(
          selectedShapes.map((s: any) => ({ ...s, isLocked: true })),
        );
      },
    };

    const unlockAllAction = {
      id: "unlock-all",
      label: "Unlock All (Non-Background)",
      readonlyOk: false,
      onSelect: () => {
        const currentPageId = editor.getCurrentPageId();
        const shapeIds = editor.getSortedChildIdsForParent(currentPageId);
        const shapesToUnlock = shapeIds
          .map((id: any) => editor.getShape(id))
          .filter((s: any) => s && s.isLocked && !s.meta?.isPageBackground) // Skip background
          .map((s: any) => ({ ...s, isLocked: false }));

        if (shapesToUnlock.length > 0) {
          editor.updateShapes(shapesToUnlock);
        }
      },
    };

    // Consolidated "Lock Page" Action
    // This handles both the Viewport (Camera) and the Background Image
    // The actual logic is now in handleTogglePageLock in AppContent,
    // this action will trigger it.
    const isCameraLockedInContextMenu = editor.getCameraOptions().isLocked; // Get current state for label

    const togglePageLockAction = {
      id: "toggle-page-lock",
      label: isCameraLockedInContextMenu ? "Unlock Page" : "Lock Page",
      readonlyOk: true,
      onSelect: () => {
        // Dispatch custom event to notify App component
        window.dispatchEvent(new CustomEvent("request-toggle-page-lock"));
      },
    };

    // New Action: Set Selected as Background
    const setAsBackgroundAction =
      selectedShapes.length === 1 && selectedShapes[0].type === "image"
        ? {
            id: "set-as-background",
            label: "Set as Page Background",
            readonlyOk: false,
            onSelect: () => {
              const shape = selectedShapes[0];
              editor.updateShape({
                ...shape,
                isLocked: true,
                meta: { ...shape.meta, isPageBackground: true },
              });
            },
          }
        : null;

    const newActions = [];

    // 1. Page Lock (First, as requested)
    newActions.push(togglePageLockAction);

    // 2. Selected Shape Actions
    if (selectedShapes.length > 0) {
      newActions.push(lockSelectedAction);
      if (setAsBackgroundAction) newActions.push(setAsBackgroundAction);
    }

    // 3. Unlock All
    newActions.push(unlockAllAction);

    return [copyToSlideAction, ...newActions, ...contextMenu];
  },
};

function AppContent() {
  const editor = useEditor();
  useGeometrySnapping(editor);
  const { mode } = useSubjectMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, _setImportProgress] = useState("");

  const setImportProgress = (msg: string) => {
    if ((window as any).electron?.ipcRenderer)
      (window as any).electron.ipcRenderer.send("console-log", msg);
    console.log(`[Import Progress] ${msg}`);
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

    // 2. Find and Toggle Background
    const currentPageId = editor.getCurrentPageId();
    const shapeIds = editor.getSortedChildIdsForParent(currentPageId);
    let backgroundShape = shapeIds
      .map((id: any) => editor.getShape(id))
      .find((s: any) => s.meta?.isPageBackground);

    // Fallback heuristics (largest image)
    if (!backgroundShape) {
      const images = shapeIds
        .map((id: any) => editor.getShape(id))
        .filter((s: any) => s.type === "image");

      if (images.length > 0) {
        // Sort by area (w * h) desc
        backgroundShape = images.sort(
          (a: any, b: any) => b.props.w * b.props.h - a.props.w * a.props.h,
        )[0];
      }
    }

    if (backgroundShape) {
      editor.updateShape({
        ...backgroundShape,
        isLocked: newLockedState,
        // Ensure it's marked as background if we are locking it
        meta: newLockedState
          ? { ...backgroundShape.meta, isPageBackground: true }
          : backgroundShape.meta,
      });
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
    // Guard: prevent deletion of page-level image shapes (PDF slide backgrounds)
    const cleanup = editor.sideEffects.registerBeforeDeleteHandler(
      "shape",
      (shape) => {
        // If a shape is a page-level image, prevent its deletion
        // We check for the explicit meta flag
        if (shape.meta?.isPageBackground) {
          return false; // Prevent deletion of background
        }
        return; // Allow deletion
      },
    );

    // Retroactively lock any existing unlocked page-level images AND add meta
    // This acts as a migration for existing projects
    const pages = editor.getPages();
    for (const page of pages) {
      const shapeIds = editor.getSortedChildIdsForParent(page.id);
      for (const id of shapeIds) {
        const shape = editor.getShape(id);
        // Heuristic: It's a background if it's an image, direct child of page,
        // and either already locked OR positioned at 0,0 (typical for imports)
        if (shape && shape.type === "image") {
          const looksLikeBackground =
            shape.isLocked || (shape.x === 0 && shape.y === 0);

          if (looksLikeBackground) {
            // Apply meta tagging and ensure locked
            if (!shape.meta?.isPageBackground || !shape.isLocked) {
              editor.updateShape({
                id: shape.id,
                type: shape.type,
                isLocked: true,
                meta: { ...shape.meta, isPageBackground: true },
              });
            }
          }
        }
      }
    }

    return cleanup;
  }, [editor]);

  const addProtractor = () => {
    editor.createShape({
      id: createShapeId(),
      type: "protractor",
      x: editor.getViewportScreenCenter().x - 150,
      y: editor.getViewportScreenCenter().y - 75,
    });
  };

  const addRuler = () => {
    editor.createShape({
      id: createShapeId(),
      type: "ruler",
      x: editor.getViewportScreenCenter().x - 150,
      y: editor.getViewportScreenCenter().y - 25,
    });
  };

  const addCompass = () => {
    editor.createShape({
      id: createShapeId(),
      type: "compass",
      x: editor.getViewportScreenCenter().x - 75,
      y: editor.getViewportScreenCenter().y - 25,
    });
  };

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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Confirm before replacing existing project
    if (hasExistingContent()) {
      const confirmed = await showConfirmDialog();
      if (!confirmed) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    setIsImporting(true);
    setImportProgress("Reading file...");
    try {
      let pdfData: string | Uint8Array = "";

      setImportProgress(
        `Reading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`,
      );

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setImportProgress("Converting file to buffer...");
        const arrayBuffer = await file.arrayBuffer();
        pdfData = new Uint8Array(arrayBuffer);

        // Save to library
        // @ts-ignore
        if (window.electron && window.electron.ipcRenderer) {
          setImportProgress("Saving to library...");
          try {
            // @ts-ignore
            await window.electron.ipcRenderer.invoke(
              "save-imported-file",
              pdfData,
              file.name,
            );
          } catch (err) {
            console.error("Failed to save file:", err);
          }
        }

        setImportProgress(
          `File loaded (${pdfData.length} bytes). Parsing PDF...`,
        );
      } else if (file.name.endsWith(".ppt") || file.name.endsWith(".pptx")) {
        // @ts-ignore
        if (window.electron && window.electron.ipcRenderer) {
          setImportProgress(
            "Converting PPT to PDF (this may take a moment)...",
          );

          const fileArrayBuffer = await file.arrayBuffer();
          const fileBytes = new Uint8Array(fileArrayBuffer);
          // @ts-ignore
          const pdfPath = await window.electron.ipcRenderer.invoke(
            "convert-ppt-buffer-to-pdf",
            Array.from(fileBytes),
            file.name,
          );

          setImportProgress("Reading converted PDF...");
          // @ts-ignore
          const pdfBuffer = await window.electron.ipcRenderer.invoke(
            "read-pdf-file",
            pdfPath,
          );
          pdfData = new Uint8Array(pdfBuffer);
          setImportProgress(`PDF ready (${pdfData.length} bytes). Parsing...`);
        } else {
          alert("PPT conversion only supported in Electron app");
          setIsImporting(false);
          return;
        }
      } else {
        alert("Unsupported file type");
        setIsImporting(false);
        return;
      }

      setImportProgress("Loading PDF engine...");

      const pdf = await loadPdf(pdfData, { verbose: true, timeout: 60000 });

      setImportProgress(
        `PDF parsed! Found ${pdf.numPages} pages. Rendering...`,
      );

      // --- Clear existing project before importing new one ---
      setImportProgress("Clearing existing project...");

      // Get all existing pages
      const existingPages = editor.getPages();
      const firstExistingPageId = existingPages[0]?.id;

      // Switch to the first page so we can safely delete others
      if (firstExistingPageId) {
        editor.setCurrentPage(firstExistingPageId);
      }

      // Delete all pages except the first one (tldraw requires at least one page)
      for (const page of existingPages) {
        if (page.id !== firstExistingPageId) {
          editor.deletePage(page.id);
        }
      }

      // Clear all shapes from the first page
      if (firstExistingPageId) {
        const shapeIds = editor.getSortedChildIdsForParent(firstExistingPageId);
        if (shapeIds.length > 0) {
          // Temporarily unlock shapes so they can be deleted
          for (const id of shapeIds) {
            const shape = editor.getShape(id);
            if (shape && shape.isLocked) {
              editor.updateShape({
                id: shape.id,
                type: shape.type,
                isLocked: false,
              });
            }
          }
          editor.deleteShapes(shapeIds);
        }
      }

      // Delete all existing assets
      const existingAssets = editor.getAssets();
      if (existingAssets.length > 0) {
        editor.deleteAssets(existingAssets.map((a) => a.id));
      }

      // Rename first page to "Slide 1"
      if (firstExistingPageId) {
        editor.renamePage(firstExistingPageId, "Slide 1");
      }

      // --- Now import the new slides ---
      let currentPageId = firstExistingPageId || editor.getCurrentPageId();

      for (let i = 1; i <= pdf.numPages; i++) {
        setImportProgress(`Rendering slide ${i} of ${pdf.numPages}...`);

        // Allow the UI to update with the new progress text
        await new Promise((resolve) => setTimeout(resolve, 50));

        const dataUrl = await renderPageToDataURL(pdf, i);

        // Create Asset
        const assetId = AssetRecordType.createId();
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        editor.createAssets([
          {
            id: assetId,
            typeName: "asset",
            type: "image",
            meta: {},
            props: {
              name: `page-${i}.png`,
              src: dataUrl,
              w: viewport.width,
              h: viewport.height,
              mimeType: "image/png",
              isAnimated: false,
            },
          },
        ]);

        // Create Page if not first
        if (i > 1) {
          currentPageId = PageRecordType.createId();
          editor.createPage({
            id: currentPageId,
            name: `Slide ${i}`,
          });
        }

        // Create Image Shape
        editor.createShape({
          type: "image",
          parentId: currentPageId,
          x: 0,
          y: 0,
          isLocked: true,
          props: {
            assetId: assetId,
            w: viewport.width,
            h: viewport.height,
          },
          meta: {
            isPageBackground: true,
          },
        });
      }

      // Navigate to first page and zoom to fit
      const newFirstPageId = editor.getPages()[0]?.id;
      if (newFirstPageId) {
        editor.setCurrentPage(newFirstPageId);
        requestAnimationFrame(() => {
          const bounds = editor.getCurrentPageBounds();
          if (bounds) {
            editor.zoomToBounds(bounds, { inset: 0 });
          } else {
            editor.zoomToFit();
          }
        });
      }
    } catch (error: any) {
      console.error("[Import] Import failed:", error);
      if ((window as any).electron?.ipcRenderer)
        (window as any).electron.ipcRenderer.send(
          "console-log",
          `[ERROR] Import failed: ${error?.message || error}`,
        );
      alert("Import failed: " + (error?.message || error));
    } finally {
      setIsImporting(false);
      setImportProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [isDesktopMode, setIsDesktopMode] = useState(false);
  const [showNavPanel, setShowNavPanel] = useState(true);
  const [navPosition, setNavPosition] = useState<"left" | "right">("right");
  const [showRecentColors, setShowRecentColors] = useState(true);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const toggleDesktopMode = () => {
    setIsDesktopMode(!isDesktopMode);
  };

  const [exitDialogVisible, setExitDialogVisible] = useState(false);

  useEffect(() => {
    const handleCloseAppRequest = () => {
      setExitDialogVisible(true);
    };
    window.addEventListener("request-close-app", handleCloseAppRequest);
    return () =>
      window.removeEventListener("request-close-app", handleCloseAppRequest);
  }, []);

  const handleCloseExitWithoutSaving = () => {
    if ((window as any).electron?.ipcRenderer)
      (window as any).electron.ipcRenderer.invoke("close-app");
  };

  const handleCloseCancel = () => {
    setExitDialogVisible(false);
  };

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

  return (
    <>
      {/* Transparent background override style */}
      {isDesktopMode && (
        <style>{`
                    .tldraw__editor { background: transparent !important; }
                    .tl-background { background: transparent !important; }
                    .tl-canvas { background: transparent !important; }
                    html, body { background: transparent !important; }
                    #root { background: transparent !important; }
                `}</style>
      )}

      <Sidebar
        onImport={handleImportClick}
        isOpen={leftSidebarOpen}
        onToggle={setLeftSidebarOpen}
      />
      <ToolsSidebar
        onImportClick={handleImportClick}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onDesktopModeToggle={toggleDesktopMode}
        showNavPanel={showNavPanel}
        onToggleNavPanel={() => setShowNavPanel(!showNavPanel)}
        showRecentColors={showRecentColors}
        onToggleRecentColors={() => setShowRecentColors(!showRecentColors)}
        isOpen={rightSidebarOpen}
        onToggle={setRightSidebarOpen}
        onAddRuler={addRuler}
        onAddProtractor={addProtractor}
        onAddCompass={addCompass}
      />
      <DrawingToolbar showRecentColors={showRecentColors} />
      <NavigationPanel isVisible={showNavPanel} position={navPosition} />
      {showNavPanel && (
        <div
          className={`fixed bottom-0 ${navPosition === "right" ? "left-0 border-l-0 rounded-tr-2xl" : "right-0 border-r-0 rounded-tl-2xl"} bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 border-b-0 p-2 z-[99999] flex items-center justify-center animate-in slide-in-from-bottom-4 fade-in duration-300`}
        >
          <div className="flex items-center justify-center h-9 px-1">
            <button
              onClick={() =>
                setNavPosition(navPosition === "right" ? "left" : "right")
              }
              className="w-3.5 h-3.5 bg-purple-500 hover:bg-purple-600 rounded-full transition-all hover:scale-110 flex-shrink-0 cursor-pointer shadow-sm"
              title="Switch Toolbar Position"
            />
          </div>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.ppt,.pptx"
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
        isVisible={isImporting}
        message="Importing File"
        subMessage={importProgress || "Please wait..."}
      />
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
      {mode === "math" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-lg rounded-xl p-2 z-[99999]">
          <button
            onClick={addProtractor}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-bold"
          >
            Add Protractor
          </button>
        </div>
      )}
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
};

function App(): JSX.Element {
  return (
    <div className="tldraw__editor" style={{ position: "fixed", inset: 0 }}>
      {/* Custom Close Button Removed - Moved to NavigationPanel */}
      <Tldraw
        persistenceKey="presentorbord-drawing-state"
        shapeUtils={customShapeUtils}
        tools={customTools}
        components={components}
        overrides={overrides}
      >
        <AppContent />
      </Tldraw>
    </div>
  );
}

export default App;
