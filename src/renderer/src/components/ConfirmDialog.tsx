import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isVisible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  secondaryConfirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onSecondaryConfirm?: () => void;
}

export function ConfirmDialog({
  isVisible,
  title = "Replace Project?",
  message = "This will replace your current project. Any unsaved changes will be lost.",
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  secondaryConfirmLabel,
  onConfirm,
  onCancel,
  onSecondaryConfirm,
}: ConfirmDialogProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[100001] flex items-center justify-center"
      style={{ animation: "confirmFadeIn 0.2s ease-out" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ animation: "confirmSlideUp 0.25s ease-out" }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed ml-[52px]">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-150"
            >
              {cancelLabel}
            </button>
            {onSecondaryConfirm && secondaryConfirmLabel && (
              <button
                onClick={onSecondaryConfirm}
                className="px-5 py-2 text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 rounded-lg transition-colors duration-150"
              >
                {secondaryConfirmLabel}
              </button>
            )}
            <button
              onClick={onConfirm}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
                @keyframes confirmFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes confirmSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
    </div>
  );
}
