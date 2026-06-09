import { useEffect } from 'react';
import Button from './Button';

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ModalActions({ onCancel, onConfirm, confirmLabel, confirmVariant = 'primary', loading }) {
  return (
    <>
      <Button variant="ghost" onClick={onCancel}>
        Batal
      </Button>
      <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
        {loading ? 'Memproses...' : confirmLabel}
      </Button>
    </>
  );
}
