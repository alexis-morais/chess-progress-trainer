import { useEffect, useRef, type ReactNode } from 'react';
import { InfoTooltip } from '../components/InfoTooltip';

export function ChoiceDialog({
  title,
  children,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    cancelButton.current?.focus();
    return () => {
      dialog.close();
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="completion-dialog computer-confirm"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2>
        {title.toLocaleLowerCase('fr').includes('promotion') ? (
          <>Choisis la <InfoTooltip term="Promotion">promotion</InfoTooltip> de ton pion</>
        ) : title}
      </h2>
      {children}
      <button ref={cancelButton} className="button secondary" onClick={onCancel}>
        Annuler
      </button>
    </dialog>
  );
}
