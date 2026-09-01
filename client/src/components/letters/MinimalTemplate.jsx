export default function MinimalTemplate({ letter }) {
  const { content = {}, images = [], title, createdAt } = letter;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <article className="mx-auto max-w-4xl bg-ethereal-surface-dim text-ethereal-tertiary">
      <div className="px-8 py-16 md:px-16 md:py-24">
        {/* Header */}
        <header className="mb-20">
          <div className="flex flex-col items-start gap-6">
            {formattedDate && (
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ethereal-primary">
                {formattedDate}
              </p>
            )}
            <h1 className="font-sans text-4xl font-light tracking-tight text-ethereal-tertiary md:text-6xl lg:text-7xl">
              {title || "Untitled"}
            </h1>
          </div>
          <div className="mt-12 h-px w-full bg-ethereal-outline" />
        </header>

        {/* Content & Images Grid */}
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24">
          <div className="lg:col-span-7">
            {content.greeting && (
              <p className="mb-12 font-sans text-xl font-medium tracking-wide text-ethereal-tertiary">
                {content.greeting}
              </p>
            )}

            {content.body && (
              <div className="whitespace-pre-wrap font-sans text-lg font-light leading-[1.8] tracking-wide text-ethereal-tertiary/80 md:text-xl">
                {content.body}
              </div>
            )}

            {content.closing && (
              <div className="mt-16">
                <p className="font-sans text-lg font-medium text-ethereal-tertiary">
                  {content.closing}
                </p>
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="flex flex-col gap-8 lg:col-span-5">
              {images.map((img, index) => (
                <figure
                  key={img._id || img.imageId || img.url || index}
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-ethereal-primary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <img
                    src={img.url}
                    alt={`Attachment ${index + 1}`}
                    className="h-auto w-full object-cover grayscale transition-all duration-700 hover:scale-105 hover:grayscale-0"
                  />
                  <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ethereal-tertiary/50">
                    FIG. {String(index + 1).padStart(2, "0")}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
