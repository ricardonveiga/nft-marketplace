import type { Nft, NftAvailability, NftRarity } from '@/types/nft'

type Seed = readonly [
  name: string,
  priceEth: string,
  edition: string,
  rarity: NftRarity,
  availability: NftAvailability,
]

const collections: ReadonlyArray<{ name: string; seeds: readonly Seed[] }> = [
  {
    name: 'Aurora Drift',
    seeds: [
      ['Brisa Dourada', '0.85', '1/50', 'raro', 'disponivel'],
      ['Véu Boreal', '1.20', '7/50', 'epico', 'disponivel'],
      ['Eco Polar', '0.45', '23/50', 'comum', 'disponivel'],
      ['Chama Glacial', '3.50', '50/50', 'lendario', 'esgotado'],
    ],
  },
  {
    name: 'Pixel Reliquary',
    seeds: [
      ['Guardião 8-bit', '0.30', '12/200', 'comum', 'disponivel'],
      ['Relíquia Cúbica', '0.75', '4/200', 'raro', 'disponivel'],
      ['Códice Quebrado', '2.10', '1/200', 'lendario', 'disponivel'],
      ['Moeda Fantasma', '0.18', '200/200', 'comum', 'esgotado'],
    ],
  },
  {
    name: 'Neon Orchard',
    seeds: [
      ['Maçã Elétrica', '0.62', '3/80', 'raro', 'disponivel'],
      ['Pomar Noturno', '0.95', '15/80', 'raro', 'disponivel'],
      ['Semente Prisma', '1.80', '2/80', 'epico', 'disponivel'],
      ['Raiz Luminosa', '0.27', '80/80', 'comum', 'esgotado'],
    ],
  },
  {
    name: 'Cobalt Tides',
    seeds: [
      ['Maré Alta', '1.05', '9/120', 'raro', 'disponivel'],
      ['Coral Sintético', '0.40', '48/120', 'comum', 'disponivel'],
      ['Abismo Azul', '2.75', '1/120', 'lendario', 'disponivel'],
      ['Concha de Sal', '0.55', '120/120', 'comum', 'esgotado'],
    ],
  },
  {
    name: 'Ember Glyphs',
    seeds: [
      ['Glifo Brasa', '0.90', '5/60', 'raro', 'disponivel'],
      ['Cinza Viva', '0.35', '31/60', 'comum', 'disponivel'],
      ['Runa Solar', '1.60', '2/60', 'epico', 'disponivel'],
      ['Fogo Antigo', '4.20', '60/60', 'lendario', 'esgotado'],
    ],
  },
  {
    name: 'Quiet Mosaic',
    seeds: [
      ['Fragmento Calmo', '0.22', '40/300', 'comum', 'disponivel'],
      ['Padrão Silente', '0.68', '17/300', 'raro', 'disponivel'],
      ['Tessela Rara', '1.35', '6/300', 'epico', 'disponivel'],
      ['Mosaico Final', '0.50', '300/300', 'raro', 'esgotado'],
    ],
  },
]

export const nfts: readonly Nft[] = collections.flatMap(
  ({ name: collection, seeds }, collectionIndex) =>
    seeds.map(([name, priceEth, edition, rarity, availability], seedIndex) => {
      const number = collectionIndex * seeds.length + seedIndex + 1

      return {
        id: `nft-${String(number).padStart(2, '0')}`,
        name,
        collection,
        imageUrl: `/nfts/nft-${String(number).padStart(2, '0')}.svg`,
        priceEth,
        edition,
        rarity,
        availability,
      }
    }),
)
