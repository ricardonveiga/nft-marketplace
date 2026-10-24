import type {
  Nft,
  NftAvailability,
  NftNetwork,
  NftRarity,
  NftReview,
} from '@/types/nft'

type Artwork = 'emerald' | 'sage' | 'neon' | 'golden'

type Seed = readonly [
  name: string,
  artwork: Artwork,
  priceEth: string,
  previousPriceEth: string | undefined,
  edition: string,
  rarity: NftRarity,
  availability: NftAvailability,
]

const collectionByArtwork: Record<Artwork, string> = {
  emerald: 'Emerald Apes',
  sage: 'Sage Nomads',
  neon: 'Neon Vessels',
  golden: 'Golden Signals',
}

export const categoryOrder = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
] as const

export const networkOrder: readonly NftNetwork[] = [
  'Ethereum',
  'Polygon',
  'Solana',
]

/** "Hoje" fixo dos mocks: mantém "Novos lançamentos" determinístico. */
export const REFERENCE_DATE = Date.UTC(2026, 9, 22)
const DAY = 24 * 60 * 60 * 1000

// Os 9 primeiros seguem a primeira página do frame Desktop / Início do Figma.
const seeds: readonly Seed[] = [
  ['Emerald Ape #042', 'emerald', '1.19', undefined, '42/500', 'comum', 'disponivel'],
  ['Sage Nomad #009', 'sage', '1.69', undefined, '9/300', 'comum', 'disponivel'],
  ['Neon Vessel #552', 'neon', '1.99', '2.29', '552/800', 'raro', 'disponivel'],
  ['Cosmic Bloom #118', 'sage', '1.29', undefined, '118/300', 'comum', 'disponivel'],
  ['Violet Nomad #314', 'sage', '1.39', undefined, '24/300', 'comum', 'disponivel'],
  ['Ivory Baron #088', 'neon', '1.79', undefined, '88/800', 'comum', 'disponivel'],
  ['Golden Beat #207', 'golden', '0.99', undefined, '207/400', 'comum', 'disponivel'],
  ['Golden Echo #333', 'golden', '0.59', undefined, '333/400', 'comum', 'esgotado'],
  ['Golden Signal #160', 'golden', '0.39', undefined, '160/400', 'comum', 'disponivel'],
  ['Emerald Ape #108', 'emerald', '2.40', undefined, '108/500', 'raro', 'disponivel'],
  ['Emerald Ape #217', 'emerald', '1.05', '1.25', '217/500', 'comum', 'disponivel'],
  ['Sage Nomad #077', 'sage', '0.85', undefined, '77/300', 'comum', 'esgotado'],
  ['Neon Vessel #301', 'neon', '3.10', undefined, '301/800', 'epico', 'disponivel'],
  ['Cosmic Bloom #054', 'sage', '1.55', undefined, '54/300', 'raro', 'disponivel'],
  ['Golden Beat #412', 'golden', '0.72', undefined, '12/400', 'comum', 'disponivel'],
  ['Ivory Baron #190', 'neon', '2.05', '2.50', '190/800', 'raro', 'disponivel'],
  ['Violet Nomad #022', 'sage', '4.20', undefined, '22/300', 'lendario', 'disponivel'],
  ['Golden Signal #089', 'golden', '0.48', undefined, '89/400', 'comum', 'disponivel'],
  ['Emerald Ape #330', 'emerald', '1.33', undefined, '330/500', 'comum', 'disponivel'],
  ['Sage Nomad #145', 'sage', '0.95', undefined, '145/300', 'comum', 'disponivel'],
  ['Neon Vessel #076', 'neon', '2.75', undefined, '76/800', 'epico', 'esgotado'],
  ['Cosmic Bloom #260', 'sage', '1.12', undefined, '260/300', 'comum', 'disponivel'],
  ['Golden Beat #003', 'golden', '5.00', undefined, '3/400', 'lendario', 'disponivel'],
  ['Ivory Baron #411', 'neon', '1.48', undefined, '411/800', 'comum', 'esgotado'],
  ['Violet Nomad #198', 'sage', '0.66', '0.80', '198/300', 'comum', 'disponivel'],
  ['Golden Signal #271', 'golden', '0.52', undefined, '271/400', 'comum', 'disponivel'],
  ['Emerald Ape #009', 'emerald', '6.50', undefined, '9/500', 'epico', 'esgotado'],
]

/** Unidades restantes da edição "atual/total"; esgotado não tem nenhuma. */
function remainingUnits(edition: string, availability: NftAvailability) {
  const [current, total] = edition.split('/').map(Number)

  return availability === 'esgotado' ? 0 : Math.max(total - current, 0)
}

export const nfts: readonly Nft[] = seeds.map(
  (
    [name, artwork, priceEth, previousPriceEth, edition, rarity, availability],
    index,
  ) => ({
    id: `nft-${String(index + 1).padStart(2, '0')}`,
    name,
    tokenId: `#${(name.match(/#(\d+)/)?.[1] ?? '0').padStart(4, '0')}`,
    collection: collectionByArtwork[artwork],
    category: categoryOrder[(index * 4 + Math.floor(index / 5)) % categoryOrder.length],
    network: networkOrder[(index + Math.floor(index / 3)) % networkOrder.length],
    imageUrl: `/nfts/${artwork}.webp`,
    priceEth,
    ...(previousPriceEth ? { previousPriceEth } : {}),
    edition,
    rarity,
    availability,
    availableQuantity: remainingUnits(edition, availability),
    version: 1,
    // Quanto menor o índice, mais recente: a ordem padrão reproduz o Figma.
    listedAt: new Date(REFERENCE_DATE - index * 2 * DAY).toISOString(),
    popularity: (index * 53 + 17) % 100,
  }),
)

const creatorByCollection: Record<string, string> = {
  'Emerald Apes': 'Luma Studio',
  'Sage Nomads': 'Atelier Verde',
  'Neon Vessels': 'Neon Forge',
  'Golden Signals': 'Ouro Digital',
}

const artworks = ['emerald', 'sage', 'neon', 'golden'] as const

export function creatorOf(nft: Nft) {
  return creatorByCollection[nft.collection] ?? 'Kurio Studio'
}

export function descriptionOf(nft: Nft) {
  return `${nft.name} faz parte da coleção ${nft.collection}, de ${creatorOf(nft)}. Arte digital da categoria ${nft.category}, emitida na rede ${nft.network} em edição limitada: cada unidade é única e verificável.`
}

/** Galeria do detalhe: a arte do NFT primeiro, seguida das demais artes do catálogo. */
export function galleryOf(nft: Nft) {
  const own = nft.imageUrl

  return [own, ...artworks.map((name) => `/nfts/${name}.webp`).filter((url) => url !== own)]
}

const attributesByCollection: Record<string, string[]> = {
  'Emerald Apes': ['Óculos', 'Esmeralda'],
  'Sage Nomads': ['Chapéu', 'Sálvia'],
  'Neon Vessels': ['Terno', 'Neon'],
  'Golden Signals': ['Fones', 'Dourado'],
}

const rarityNames: Record<NftRarity, string> = {
  comum: 'Comum',
  raro: 'Raro',
  epico: 'Épico',
  lendario: 'Lendário',
}

/** Resumo curto ("Sobre este NFT"). */
export function aboutOf(nft: Nft) {
  return `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${nft.network}, com arte desbloqueável e acesso para colecionadores.`
}

export function summaryOf(nft: Nft) {
  return `Um colecionável digital ${nft.edition} finalizado à mão da coleção Kurio Editions, verificado na ${nft.network}.`
}

export function attributesOf(nft: Nft) {
  return [...(attributesByCollection[nft.collection] ?? []), rarityNames[nft.rarity]]
}

/** Opções de edição: as tiragens menores, a do NFT e a aberta. */
export function editionOptionsOf(nft: Nft) {
  return [...new Set(['1/1', '1/10', nft.edition, 'ABERTA'])]
}

/** Nota média e total de avaliações, derivados da popularidade (determinístico). */
export function ratingOf(nft: Nft) {
  return { average: 3.5 + (nft.popularity % 3) * 0.5, count: nft.popularity + 2 }
}

export function storyOf(nft: Nft) {
  return [
    `${nft.name} é uma obra digital ${nft.edition} finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${nft.network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
    `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creatorOf(nft)} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
  ]
}

export function networkNoteOf(nft: Nft) {
  return `Cunhado na ${nft.network} com procedência imutável e metadados armazenados no IPFS.`
}

export const CONTRACT_NOTE = 'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.'
export const COPYRIGHT_NOTE = '0x7A42...19E8 · Contrato inteligente ERC-721 verificado.'

const reviewAuthors = ['Marina Duarte', 'Rafael Nunes', 'Camila Torres', 'Diego Lopes', 'Helena Faria', 'Bruno Costa']
const reviewTexts = [
  'Arte linda e entrega rápida na carteira. Superou o que eu esperava.',
  'Os detalhes ficam ainda melhores em alta resolução. Boa compra.',
  'Procedência clara e metadados conferidos. Recomendo a coleção.',
  'Gostei do acesso exclusivo para colecionadores. Vale o preço.',
  'Transação simples e sem surpresas. Já estou de olho nos próximos lançamentos.',
]

/** Avaliações do NFT: sempre a quantidade de `ratingOf`, com textos e datas determinísticos. */
export function reviewsOf(nft: Nft): NftReview[] {
  return Array.from({ length: ratingOf(nft).count }, (_, index) => ({
    id: `${nft.id}-review-${index + 1}`,
    author: reviewAuthors[(index + nft.popularity) % reviewAuthors.length],
    rating: index % 4 === 3 ? 4 : 5,
    text: reviewTexts[(index * 2 + nft.popularity) % reviewTexts.length],
    createdAt: new Date(REFERENCE_DATE - (index + 1) * 3 * DAY).toISOString(),
  }))
}
