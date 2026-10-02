// Empty state ramah: ikon + judul + deskripsi + aksi opsional.
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-huge px-lg gap-md">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
          <Icon size={28} className="text-on-surface-variant" />
        </div>
      )}
      <div className="flex flex-col gap-xs">
        <h3 className="font-h3 text-h3 text-on-surface">{title}</h3>
        {description && (
          <p className="font-body text-body text-on-surface-variant max-w-sm">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
