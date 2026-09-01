export default function ClassicTemplate({ letter }) {
  const { content = {}, images = [], title, createdAt } = letter;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article className="mx-auto max-w-3xl overflow-hidden rounded-[1.25rem] bg-ethereal-surface text-ethereal-tertiary shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-ethereal-outline">
      {/* Top accent */}
      <div className="h-1 bg-ethereal-primary" />

      {/* Header */}
      <header className="px-7 pb-10 pt-12 text-center sm:px-12 md:px-16 md:pt-16">
        <div className="mx-auto mb-7 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-ethereal-primary/50" />
          <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-ethereal-primary">
            Tether
          </span>
          <span className="h-px w-12 bg-ethereal-primary/50" />
        </div>

        <h1 className="font-heading text-4xl font-medium leading-tight tracking-[-0.02em] text-ethereal-tertiary sm:text-5xl">
          {title || "Untitled Letter"}
        </h1>

        {formattedDate && (
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.22em] text-ethereal-tertiary/70">
            {formattedDate}
          </p>
        )}
      </header>

      {/* Letter body */}
      <main className="mx-3 mb-3 overflow-hidden rounded-[1rem] bg-ethereal-surface-dim sm:mx-5 sm:mb-5">
        <div className="px-6 py-10 sm:px-10 sm:py-14 md:px-14 md:py-16">
          {/* Greeting */}
          {content.greeting && (
            <div className="mb-10">
              <p className="font-heading text-xl italic leading-relaxed text-ethereal-tertiary/90 sm:text-2xl">
                {content.greeting}
              </p>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <section className="mb-12">
              {images.length === 1 ? (
                <figure className="overflow-hidden rounded-xl border border-ethereal-outline bg-ethereal-surface p-2 shadow-md">
                  <img
                    src={images[0].url}
                    alt="Letter memory"
                    className="max-h-[520px] w-full rounded-lg object-cover"
                  />
                </figure>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {images.map((img, index) => (
                    <figure
                      key={img._id || img.imageId || img.url || index}
                      className="overflow-hidden rounded-xl border border-ethereal-outline bg-ethereal-surface p-1.5 shadow-sm"
                    >
                      <img
                        src={img.url}
                        alt={`Letter memory ${index + 1}`}
                        className="aspect-[4/5] w-full rounded-lg object-cover"
                      />
                    </figure>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Body */}
          {content.body && (
            <div className="border-l-2 border-ethereal-primary/40 pl-5 sm:pl-7">
              <p className="whitespace-pre-wrap font-heading text-[1.08rem] leading-[2] text-ethereal-tertiary sm:text-xl sm:leading-[2.05]">
                {content.body}
              </p>
            </div>
          )}

          {/* Closing */}
          {content.closing && (
            <div className="mt-14 border-t border-ethereal-outline pt-8">
              <p className="max-w-sm font-heading text-lg italic leading-relaxed text-ethereal-tertiary/90 sm:text-xl">
                {content.closing}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 pb-8 text-center sm:px-10">
        <div className="mx-auto flex max-w-[160px] items-center gap-3">
          <div className="h-px flex-1 bg-ethereal-primary/60" />
          <div className="h-1.5 w-1.5 rounded-full bg-ethereal-primary" />
          <div className="h-px flex-1 bg-ethereal-primary/60" />
        </div>
      </footer>
    </article>
  );
}
