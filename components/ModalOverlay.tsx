'use client';

import { useEffect } from 'react';

export default function ModalOverlay({ children, onClose }: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <div data-modal className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />
      <div className="relative max-h-[90vh] overflow-y-auto w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
