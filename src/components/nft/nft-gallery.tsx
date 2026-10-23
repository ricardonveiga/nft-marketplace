import { useState } from 'react'

type NftGalleryProps = {
  images: string[]
  name: string
  soldOut: boolean
}

/** Imagem principal + miniaturas selecionáveis (botões, acessíveis por teclado). */
export function NftGallery({ images, name, soldOut }: NftGalleryProps) {
  const [active, setActive] = useState(0)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-card">
        <img
          src={images[active]}
          alt={`${name}, imagem ${active + 1} de ${images.length}`}
          width={600}
          height={600}
          fetchPriority="high"
          data-testid="gallery-main"
          className={`size-full object-cover ${soldOut ? 'opacity-60' : ''}`}
        />
        {soldOut && (
          <span className="absolute top-4 left-4 rounded-full bg-background/90 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            Esgotado
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul aria-label="Miniaturas da galeria" className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
                className={`block aspect-square w-full overflow-hidden rounded-lg border-2 bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${index === active ? 'border-primary' : 'border-transparent hover:border-border-soft'}`}
              >
                <img src={image} alt="" width={150} height={150} loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
