import { env } from '@/config/env'
import { httpCatalogApi } from './catalog.http'
import { mockCatalogApi } from './catalog.mock'

export const catalogApi = env.isMock ? mockCatalogApi : httpCatalogApi
