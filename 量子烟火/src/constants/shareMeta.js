/** 社交分享与 SEO 元信息（随 VITE_CAMPUS 切换） */
import { campus } from './config/campus/index.js'

export const SITE_URL = campus.siteUrl

export const SHARE_META = {
  ...campus.shareMeta,
  ogImage: `${campus.siteUrl}/og-image.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  locale: 'zh_CN',
  siteName: '量子烟火',
}
