const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_FILE_BYTES = 2 * 1024 * 1024
const AVATAR_SIZE = 256

/** Erro com mensagem pronta para a pessoa (arquivo inválido, grande demais, ilegível). */
export class AvatarError extends Error {}

/**
 * Prepara a foto do perfil no navegador: confere tipo e tamanho, recorta o quadrado central e
 * reduz para 256 × 256 em WebP. Devolve um data URL pequeno (~15 KB), nunca o arquivo original.
 */
export async function prepareAvatar(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AvatarError('Use uma imagem PNG, JPEG ou WebP.')
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new AvatarError('A imagem deve ter até 2 MB.')
  }

  let bitmap: ImageBitmap

  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new AvatarError('Não foi possível ler esta imagem. Tente outro arquivo.')
  }

  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE

  const context = canvas.getContext('2d')

  if (!context) {
    throw new AvatarError('Não foi possível processar esta imagem.')
  }

  context.imageSmoothingQuality = 'high'
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  )
  bitmap.close()

  return canvas.toDataURL('image/webp', 0.85)
}
