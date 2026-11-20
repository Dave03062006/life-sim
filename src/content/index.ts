import type { Life } from '../life/types'
import { indonesia } from './countries/indonesia'
import type { ContentPack } from './types'

export function packFor(country: Life['country']): ContentPack {
  return { indonesia }[country]
}
