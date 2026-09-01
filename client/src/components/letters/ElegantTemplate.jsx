export default function ElegantTemplate({ letter }) {
  const { content = {}, images = [], title, createdAt } = letter;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article className="mx-auto max-w-4xl bg-ethereal-surface p-4 shadow-2xl md:p-8">
      {/* Outer Border */}
      <div className="border border-ethereal-outline p-2">
        {/* Inner Border */}
        <div className="border border-ethereal-outline/50 p-6 sm:p-12 md:p-16">
          {/* Header */}
          <header className="mb-16 text-center">
            {formattedDate && (
              <p className="mb-6 font-sans text-xs uppercase tracking-[0.3em] text-ethereal-tertiary/70">
                {formattedDate}
              </p>
            )}
            <h1 className="font-heading text-4xl font-light leading-snug tracking-wide text-ethereal-primary md:text-5xl lg:text-6xl">
              {title || "Untitled"}
            </h1>
            <div className="mx-auto mt-10 flex w-32 items-center justify-center gap-2">
              <span className="h-[1px] flex-1 bg-ethereal-outline" />
              <span className="h-1.5 w-1.5 rotate-45 transform bg-ethereal-primary" />
              <span className="h-[1px] flex-1 bg-ethereal-outline" />
            </div>
          </header>

          {/* Greeting */}
          {content.greeting && (
            <div className="mb-12 text-center">
              <p className="font-heading text-2xl italic tracking-wide text-ethereal-tertiary">
                {content.greeting}
              </p>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-10">
              {images.map((img, index) => (
                <figure
                  key={img._id || img.imageId || img.url || index}
                  className={`overflow-hidden border border-ethereal-outline bg-ethereal-surface-dim p-2 shadow-sm transition-transform duration-500 hover:scale-[1.02] ${
                    images.length === 1 ? "sm:col-span-2 sm:mx-auto sm:max-w-2xl" : ""
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Attachment ${index + 1}`}
                    className="h-auto w-full object-cover sepia-[0.2]"
                  />
                </figure>
              ))}
            </div>
          )}

          {/* Body */}
          {content.body && (
            <div className="mx-auto max-w-2xl text-center">
              <p className="whitespace-pre-wrap font-heading text-lg font-light leading-[2.2] text-ethereal-tertiary/90 sm:text-xl sm:leading-[2.4]">
                {content.body}
              </p>
            </div>
          )}

          {/* Closing */}
          {content.closing && (
            <footer className="mt-20 flex flex-col items-center">
              <div className="mb-6 h-[1px] w-24 bg-ethereal-outline" />
              <p className="font-heading text-xl italic tracking-widest text-ethereal-primary">
                {content.closing}
              </p>
            </footer>
          )}
        </div>
      </div>
    </article>
  );
}
