import { motion } from "framer-motion";

export default function ScrapbookTemplate({ letter }) {
  const { content = {}, images = [], title, createdAt } = letter;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-ethereal-surface-dim p-6 shadow-ambient md:p-12">
      {/* Texture overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/handmade-paper.png')" }}></div>

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Header */}
        <header className="relative mb-16 text-center">
          {/* Decorative Tape */}
          <div className="absolute -top-6 left-1/2 h-8 w-32 -translate-x-1/2 -rotate-2 bg-ethereal-outline/40 shadow-sm backdrop-blur-md" />

          <h1 className="mt-8 font-heading text-4xl font-bold italic text-ethereal-tertiary md:text-5xl lg:text-6xl">
            {title || "A Beautiful Memory"}
          </h1>
          
          {formattedDate && (
            <div className="mt-6 flex justify-center">
              <span className="inline-block -rotate-1 transform border border-ethereal-outline bg-ethereal-surface px-4 py-1.5 font-mono text-sm tracking-widest text-ethereal-primary shadow-sm">
                {formattedDate}
              </span>
            </div>
          )}
        </header>

        {/* Greeting */}
        {content.greeting && (
          <div className="mb-12 inline-block -rotate-1 rounded-sm bg-ethereal-surface px-6 py-3 shadow-md">
            <p className="font-heading text-2xl font-medium text-ethereal-tertiary">
              {content.greeting}
            </p>
          </div>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div className="my-16 flex flex-wrap justify-center gap-8 md:gap-12">
            {images.map((img, i) => {
              const rotation = i % 2 === 0 ? i * 2.5 + 2 : -(i * 2.5 + 2);
              const zIndex = images.length - i;

              return (
                <motion.figure
                  key={img._id || img.imageId || img.url || i}
                  whileHover={{ scale: 1.05, rotate: 0, zIndex: 100 }}
                  className="relative max-w-[280px] border border-ethereal-outline bg-[#F9F9F9] p-4 pb-12 shadow-xl sm:max-w-[320px]"
                  style={{ transform: `rotate(${rotation}deg)`, zIndex }}
                >
                  {/* Tape */}
                  <div className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-1 bg-white/60 shadow-sm backdrop-blur-sm" />
                  
                  <img
                    src={img.url}
                    alt={`Memory ${i + 1}`}
                    className="h-auto w-full object-cover"
                  />
                  <figcaption className="absolute bottom-4 w-full text-center font-heading text-lg italic text-[#2c2c2c] opacity-70">
                    Snap {i + 1}
                  </figcaption>
                </motion.figure>
              );
            })}
          </div>
        )}

        {/* Body */}
        {content.body && (
          <div className="relative mb-12 rounded-xl border border-ethereal-outline bg-ethereal-surface p-8 shadow-sm md:p-12">
            <div className="absolute left-6 top-0 h-full w-px bg-ethereal-primary/20" />
            <div className="absolute left-8 top-0 h-full w-px bg-ethereal-primary/20" />
            
            <div className="whitespace-pre-wrap pl-8 font-heading text-lg leading-[2.2] text-ethereal-tertiary sm:text-xl">
              {content.body}
            </div>
          </div>
        )}

        {/* Closing */}
        {content.closing && (
          <footer className="mt-8 flex justify-end">
            <div className="rotate-2 transform border-b-2 border-ethereal-primary pb-1 pr-4 text-right">
              <p className="font-heading text-2xl italic text-ethereal-tertiary">
                {content.closing}
              </p>
            </div>
          </footer>
        )}
      </div>
    </article>
  );
}
