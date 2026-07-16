import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "هل أنت متأكد؟",
  description = "لا يمكن التراجع عن هذا الإجراء بعد إتمامه.",
  confirmText = "تأكيد الحذف",
  cancelText = "إلغاء",
  variant = 'danger'
}: ConfirmationDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <AlertDialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
          <AlertDialog.Portal forceMount>
            <AlertDialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              />
            </AlertDialog.Overlay>
            
            <AlertDialog.Content asChild>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl text-right relative overflow-hidden"
                >
                  {/* Decorative background accent */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none ${
                    variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-gray-800'
                  }`} />

                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      variant === 'danger' ? 'bg-red-500/10 text-red-400' : variant === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-800/10 text-gray-400'
                    }`}>
                      {variant === 'danger' ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    
                    <div className="flex-1 space-y-2 min-w-0">
                      <AlertDialog.Title className="text-lg font-black text-white leading-tight">
                        {title}
                      </AlertDialog.Title>
                      
                      <AlertDialog.Description className="text-sm text-gray-400 leading-relaxed">
                        {description}
                      </AlertDialog.Description>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-row-reverse gap-3">
                    <AlertDialog.Action asChild>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onConfirm();
                          onClose();
                        }}
                        className={`flex-1 py-3 px-4 font-bold text-sm rounded-xl transition-all shadow-lg ${
                          variant === 'danger' 
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
                            : variant === 'warning' 
                              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-900/20' 
                              : 'bg-gray-800 hover:bg-gray-800 text-white shadow-blue-900/20'
                        }`}
                      >
                        {confirmText}
                      </button>
                    </AlertDialog.Action>

                    <AlertDialog.Cancel asChild>
                      <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm rounded-xl transition-all border border-gray-700/60"
                      >
                        {cancelText}
                      </button>
                    </AlertDialog.Cancel>
                  </div>
                </motion.div>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )}
    </AnimatePresence>
  );
}
