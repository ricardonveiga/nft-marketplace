import { Search } from 'lucide-react'
import { useState } from 'react'

type NftGalleryProps = {
  images: string[]
  name: string
  soldOut: boolean
}

/** Miniaturas (botões, acessíveis por teclado) ao lado da imagem principal, como no Figma. */
export function NftGallery({ images, name, soldOut }: NftGalleryProps) {
  const [active, setActive] = useState(0)

  return (
    <>
      {images.length > 1 && (
        <ul aria-label="Miniaturas da galeria" className="order-2 grid grid-cols-4 gap-3 lg:order-none lg:flex lg:flex-col lg:gap-4">
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
                className={`block aspect-square w-full overflow-hidden rounded-[3px] bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:size-[100px] ${index === active ? '' : 'opacity-70 hover:opacity-100'}`}
              >
                <img src={image} alt="" width={100} height={100} loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative flex aspect-square items-center justify-center bg-card lg:mt-0.5 lg:size-[444px]">
        <img
          src={images[active]}
          alt={`${name}, imagem ${active + 1} de ${images.length}`}
          width={600}
          height={600}
          fetchPriority="high"
          data-testid="gallery-main"
          className={`size-[calc(100%-42px)] rounded-[20px] object-cover ${soldOut ? 'opacity-60' : ''}`}
        />
        <button
          type="button"
          aria-disabled="true"
          title="Em breve"
          aria-label="Ampliar imagem"
          className="absolute top-[18px] right-[18px] grid size-[26px] cursor-not-allowed place-items-center rounded-full bg-background/80 text-foreground"
        >
          <Search className="size-4" aria-hidden="true" />
        </button>
        {soldOut && (
          <span className="absolute top-4 left-4 rounded-full bg-background/90 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            Esgotado
          </span>
        )}
      </div>
    </>
  )
}
