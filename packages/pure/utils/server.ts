import {type CollectionEntry, getCollection} from 'astro:content'

type BlogEntry = CollectionEntry<'blog'>
/** Helper for functions that only accept blog entries. */
type Collections = BlogEntry[]

export const prod = import.meta.env.PROD

/** URL slug for a blog entry: explicit frontmatter slug, falling back to content id. */
export function getPostSlug(post: BlogEntry): string {
  return post.data.slug || post.id
}

/** Note: this function filters out draft posts based on the environment */
export async function getBlogCollection(): Promise<BlogEntry[]> {
  return await getCollection('blog', (entry: BlogEntry) => {
    // Not in production & draft is not false
    return prod ? !entry.data.draft : true
  })
}

function getYearFromCollection(collection: BlogEntry): number | undefined {
  const dateStr = collection.data.updatedDate ?? collection.data.publishDate
  return dateStr ? new Date(dateStr).getFullYear() : undefined
}
export function groupCollectionsByYear(
  collections: Collections
): [number, BlogEntry[]][] {
  const collectionsByYear = collections.reduce((acc, collection) => {
    const year = getYearFromCollection(collection)
    if (year !== undefined) {
      if (!acc.has(year)) {
        acc.set(year, [])
      }
      acc.get(year)?.push(collection)
    }
    return acc
  }, new Map<number, BlogEntry[]>())

  return Array.from(collectionsByYear.entries()).sort((a, b) => b[0] - a[0])
}

/** Structural generic: works for blog entries and skills entries alike. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sortMDByDate<T extends { data: any }>(collections: T[]): T[] {
  return collections.sort((a, b) => {
    const aDate = new Date(a.data.updatedDate ?? a.data.publishDate ?? 0).valueOf()
    const bDate = new Date(b.data.updatedDate ?? b.data.publishDate ?? 0).valueOf()
    return bDate - aDate
  })
}

/** Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so. */
export function getAllTags(collections: Collections) {
  return collections.flatMap((collection) => [...collection.data.tags])
}

/** Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so. */
export function getUniqueTags(collections: Collections) {
  return [...new Set(getAllTags(collections))]
}

/** Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so. */
export function getUniqueTagsWithCount(collections: Collections): [string, number][] {
  return [
    ...getAllTags(collections).reduce(
      (acc, t) => acc.set(t, (acc.get(t) || 0) + 1),
      new Map<string, number>()
    )
  ].sort((a, b) => b[1] - a[1])
}

/** Category helpers (single-value category per post). */
export function getAllCategories(collections: Collections) {
  return collections.map((collection) => collection.data.category || '未分类')
}

export function getUniqueCategories(collections: Collections) {
  return [...new Set(getAllCategories(collections))]
}

export function getUniqueCategoriesWithCount(collections: Collections): [string, number][] {
  return [
    ...getAllCategories(collections).reduce(
      (acc, c) => acc.set(c, (acc.get(c) || 0) + 1),
      new Map<string, number>()
    )
  ].sort((a, b) => b[1] - a[1])
}

/** Tag-overlap based "related posts" picker.
 *  Score = number of shared tags. Ties broken by recency (newer first).
 *  Always excludes the current post itself. Falls back to recency-only
 *  if the post has no tags or no overlap exists.
 */
export function getRelatedPosts(
  current: BlogEntry,
  all: BlogEntry[],
  limit = 4
): BlogEntry[] {
  const currentTags = current.data.tags ?? []
  const candidates = all.filter((p) => p.id !== current.id)

  const scored = candidates.map((p) => {
    const tags = p.data.tags ?? []
    // Formal tags like 教程/总结 appear on many unrelated posts and add noise, skip them.
    const FORM_TAGS = ['教程', '总结', '笔记', '知识点', '翻译', '工具']
    const meaningful = (arr: string[]) => arr.filter((t) => !FORM_TAGS.includes(t))
    const shared = meaningful(currentTags).filter((t) => meaningful(tags).includes(t)).length
    // Same category adds a small bonus (topically closer than tag overlap alone)
    const catBonus = current.data.category && current.data.category === p.data.category ? 0.5 : 0
    const date = new Date(p.data.updatedDate ?? p.data.publishDate ?? 0).valueOf()
    return { post: p, score: shared + catBonus, date }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.date - a.date
  })

  const hasOverlap = scored.some((s) => s.score > 0)
  if (!hasOverlap) return scored.slice(0, limit).map((s) => s.post)

  const out: BlogEntry[] = []
  for (const s of scored) {
    if (s.score > 0) out.push(s.post)
    else break
    if (out.length >= limit) break
  }
  if (out.length < limit) {
    for (const s of scored) {
      if (out.includes(s.post)) continue
      out.push(s.post)
      if (out.length >= limit) break
    }
  }
  return out
}
