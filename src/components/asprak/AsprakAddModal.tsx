import AsprakForm, { AsprakFormData } from './AsprakForm';

interface AsprakAddModalProps {
  existingCodes: string[];
  availablePraktikums: { id: string; nama: string }[];
  onSubmit: (data: AsprakFormData) => Promise<void>;
  onClose: () => void;
}

export default function AsprakAddModal({
  existingCodes,
  availablePraktikums,
  onSubmit,
  onClose,
}: AsprakAddModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="card glass"
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          Input Manual Asprak
        </h2>

        <AsprakForm
          existingCodes={existingCodes}
          availablePraktikums={availablePraktikums}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
