export default function VintageTemplate({ letter }) {
  const { content = {}, images = [], title, createdAt } = letter;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <article className="mx-auto max-w-3xl overflow-hidden rounded-sm bg-[#EAE0D5] text-[#4A3C31] shadow-2xl sepia-[0.3] transition-all duration-700 hover:sepia-0 dark:bg-[#2A2421] dark:text-[#E8DCCB]">
      <div className="relative border-b-2 border-dashed border-[#8E7966]/40 p-8 text-center md:p-12">
        {/* Stamp Placeholder */}
        <div className="absolute right-6 top-6 h-16 w-12 border-2 border-dashed border-[#8E7966]/50 bg-transparent opacity-60 flex items-center justify-center">
          <span className="text-[8px] uppercase tracking-widest text-[#8E7966] rotate-[-15deg]">Stamp</span>
        </div>

        <h1 className="mt-4 font-heading text-5xl font-bold tracking-tight text-[#5C4D42] dark:text-[#C5B3A0] md:text-6xl">
          {title || "Journal Entry"}
        </h1>
        {formattedDate && (
          <p className="mt-4 font-mono text-sm tracking-[0.2em] uppercase text-[#8E7966] dark:text-[#9A8C7F]">
            {formattedDate}
          </p>
        )}
      </div>

      <div className="p-8 md:p-14">
        {content.greeting && (
          <p className="mb-8 font-heading text-3xl italic text-[#5C4D42] dark:text-[#C5B3A0]">
            {content.greeting}
          </p>
        )}

        {images.length > 0 && (
          <div className="mb-12 flex flex-col gap-6">
            {images.map((img, index) => (
              <figure
                key={img._id || img.imageId || img.url || index}
                className="relative overflow-hidden rounded-sm border-8 border-white bg-white shadow-md dark:border-[#3A332E] dark:bg-[#3A332E]"
              >
                <img
                  src={img.url}
                  alt={`Vintage memory ${index + 1}`}
                  className="w-full object-cover sepia-[0.4] filter transition-all duration-500 hover:sepia-0"
                />
              </figure>
            ))}
          </div>
        )}

        {content.body && (
          <div className="relative font-heading text-lg leading-[2.4] text-[#4A3C31] dark:text-[#E8DCCB] sm:text-xl">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-[#8E7966]/20" />
            <p className="whitespace-pre-wrap pl-6">{content.body}</p>
          </div>
        )}

        {content.closing && (
          <div className="mt-16 text-right">
            <p className="font-heading text-3xl font-light italic text-[#5C4D42] dark:text-[#C5B3A0]">
              {content.closing}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
