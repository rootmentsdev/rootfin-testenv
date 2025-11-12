const Head = ({ title, description, actions }) => {
  if (!title && !description && !actions) {
    return null;
  }

    return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        {title && (
          <h1 className="text-2xl font-semibold text-[#1f2937]">{title}</h1>
        )}
        {description && (
          <p className="text-base text-[#6b7280]">{description}</p>
        )}
                </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
};

export default Head;
