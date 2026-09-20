function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-4">
      {eyebrow && (
        <div className="text-uppercase small fw-semibold text-secondary mb-2">
          {eyebrow}
        </div>
      )}

      <h2 className="fw-bold mb-2">{title}</h2>

      {description && (
        <p className="text-secondary mb-0">{description}</p>
      )}
    </div>
  );
}

export default SectionHeader;