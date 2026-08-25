import { supabase } from './supabase';
import {
  NewsArticle,
  NewsCategory,
  NewsStatus,
  CreateNewsDto,
  UpdateNewsDto,
  NotificationDbType,
  NotificationTargetType,
} from '@hackers-unity/shared-types';
import { createNotification } from './notification-service';

// ─── HELPERS ─────────────────────────────────────────────

function mapDbToNewsArticle(row: any): NewsArticle {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || null,
    content: row.content || null,
    coverImage: row.cover_image || null,
    category: row.category as NewsCategory,
    authorId: row.author_id || null,
    authorName: row.profiles?.name || null,
    authorAvatar: row.profiles?.avatar_url || null,
    status: row.status as NewsStatus,
    publishedAt: row.published_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

import { MOCK_NEWS } from './mock-data';

// ─── FETCH PUBLISHED NEWS ────────────────────────────────

export async function fetchPublishedNews(
  limit = 20,
  offset = 0,
  category?: NewsCategory
): Promise<{ data: NewsArticle[]; total: number; error?: string }> {
  try {
    let query = supabase
      .from('news')
      .select(`
        *,
        profiles:author_id (name, avatar_url)
      `, { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, count, error } = await query;

    if (error || !data || data.length === 0) {
      // Fallback to MOCK_NEWS if DB table is empty or pending migration
      let filtered = MOCK_NEWS.filter((n) => n.status === NewsStatus.PUBLISHED);
      if (category) {
        filtered = filtered.filter((n) => n.category === category);
      }
      return {
        data: filtered.slice(offset, offset + limit),
        total: filtered.length,
      };
    }
    return {
      data: (data || []).map(mapDbToNewsArticle),
      total: count || data.length,
    };
  } catch (err: any) {
    let filtered = MOCK_NEWS.filter((n) => n.status === NewsStatus.PUBLISHED);
    if (category) {
      filtered = filtered.filter((n) => n.category === category);
    }
    return { data: filtered.slice(offset, offset + limit), total: filtered.length, error: err.message };
  }
}

// ─── FETCH NEWS BY SLUG ──────────────────────────────────

export async function fetchNewsBySlug(
  slug: string
): Promise<{ data: NewsArticle | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select(`
        *,
        profiles:author_id (name, avatar_url)
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      const found = MOCK_NEWS.find((n) => n.slug === slug);
      return { data: found || null };
    }
    return { data: mapDbToNewsArticle(data) };
  } catch (err: any) {
    const found = MOCK_NEWS.find((n) => n.slug === slug);
    return { data: found || null, error: err.message };
  }
}

// ─── FETCH ALL NEWS (Admin — includes drafts) ────────────

export async function fetchAllNews(
  authorId: string,
  limit = 50
): Promise<{ data: NewsArticle[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select(`
        *,
        profiles:author_id (name, avatar_url)
      `)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { data: [], error: error.message };
    return { data: (data || []).map(mapDbToNewsArticle) };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}

// ─── CREATE NEWS ─────────────────────────────────────────

export async function createNews(
  dto: CreateNewsDto,
  authorId: string
): Promise<{ data: NewsArticle | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('news')
      .insert({
        title: dto.title,
        slug: dto.slug || '',
        description: dto.description || null,
        content: dto.content || null,
        cover_image: dto.coverImage || null,
        category: dto.category,
        author_id: authorId,
        status: dto.status || 'draft',
        published_at: dto.status === 'published' ? new Date().toISOString() : null,
      })
      .select(`
        *,
        profiles:author_id (name, avatar_url)
      `)
      .single();

    if (error) return { data: null, error: error.message };

    const article = data ? mapDbToNewsArticle(data) : null;

    // Send notification if requested and article is published
    if (dto.sendNotification && article && dto.status === 'published') {
      await createNotification(
        {
          title: `📰 ${article.title}`,
          message: article.description || 'A new article has been published on Hacker\'s Unity.',
          type: NotificationDbType.NEWS,
          icon: '📰',
          newsId: article.id,
          targetType: NotificationTargetType.ALL,
          actionUrl: `/news/${article.slug}`,
        },
        authorId
      );
    }

    return { data: article };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

// ─── UPDATE NEWS ─────────────────────────────────────────

export async function updateNews(
  id: string,
  dto: UpdateNewsDto
): Promise<{ error?: string }> {
  try {
    const updatePayload: any = {};
    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.description !== undefined) updatePayload.description = dto.description;
    if (dto.content !== undefined) updatePayload.content = dto.content;
    if (dto.coverImage !== undefined) updatePayload.cover_image = dto.coverImage;
    if (dto.category !== undefined) updatePayload.category = dto.category;
    if (dto.status !== undefined) {
      updatePayload.status = dto.status;
      if (dto.status === 'published') {
        updatePayload.published_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('news')
      .update(updatePayload)
      .eq('id', id);

    if (error) return { error: error.message };
    return {};
  } catch (err: any) {
    return { error: err.message };
  }
}

// ─── DELETE NEWS ─────────────────────────────────────────

export async function deleteNews(id: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);

    if (error) return { error: error.message };
    return {};
  } catch (err: any) {
    return { error: err.message };
  }
}

// ─── NEWS CATEGORY LABELS ────────────────────────────────

export function getNewsCategoryLabel(category: NewsCategory): string {
  switch (category) {
    case NewsCategory.HACKATHONS: return 'Hackathons';
    case NewsCategory.TECHNOLOGY: return 'Technology';
    case NewsCategory.AI: return 'AI';
    case NewsCategory.COMPETITIONS: return 'Competitions';
    case NewsCategory.INTERNSHIPS: return 'Internships';
    case NewsCategory.OPPORTUNITIES: return 'Opportunities';
    case NewsCategory.PLATFORM_UPDATES: return "Hacker's Unity Updates";
    default: return 'News';
  }
}

export function getNewsCategoryColor(category: NewsCategory): { bg: string; text: string; border: string } {
  switch (category) {
    case NewsCategory.HACKATHONS: return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' };
    case NewsCategory.TECHNOLOGY: return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' };
    case NewsCategory.AI: return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case NewsCategory.COMPETITIONS: return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case NewsCategory.INTERNSHIPS: return { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' };
    case NewsCategory.OPPORTUNITIES: return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case NewsCategory.PLATFORM_UPDATES: return { bg: 'bg-sky-50', text: 'text-[#0099e6]', border: 'border-sky-200' };
    default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
  }
}
