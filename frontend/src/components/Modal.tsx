import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

  // Focus management and trap
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus the close button initially
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    // Focus trap: keep focus within modal
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Handle Escape key
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleTabKey);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = '';

      // Restore focus to the previously focused element
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white dark:bg-monday-darkLight rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-300`}
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-monday-border dark:border-gray-700 flex-shrink-0">
          <h3 id={titleId} className="text-lg md:text-xl font-bold text-monday-text dark:text-white">
            {title}
          </h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:rotate-90 focus:outline-none focus:ring-2 focus:ring-monday-primary focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}


