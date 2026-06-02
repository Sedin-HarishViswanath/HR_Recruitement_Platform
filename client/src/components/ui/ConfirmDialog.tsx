import { Dialog, DialogContent } from './dialog';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type Variant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
}

const VARIANT_CONFIG: Record<Variant, { icon: typeof AlertTriangle; iconBg: string; iconColor: string; btnClass: string }> = {
  danger: {
    icon: XCircle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    btnClass: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    btnClass: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
  },
};

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  loading = false,
}: ConfirmDialogProps) => {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-0 shadow-2xl">
        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 ${cfg.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
            <Icon size={22} className={cfg.iconColor} />
          </div>

          {/* Text */}
          <h3 className="text-[15px] font-bold text-slate-900 mb-1.5 leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            {title}
          </h3>
          <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${cfg.btnClass}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
