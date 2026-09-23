import Parser from "rss-parser";
import { config } from "../config.js";
import cache from "./cache.service.js";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; TradiaBot/1.0)" },
  customFields: {
    item: [["media:content", "mediaContent", { keepArray: true }]],
  },
});

function extractImage(item) {
  const fromMedia = item.mediaContent?.[0]?.$?.url;
  if (fromMedia) return fromMedia;
  const match = item.content?.match(/<img[^>]+src="([^"]+)"/i);
  return match?.[1] || null;
}

async function fetchFeed({ source, url }) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map((item) => ({
      title: item.title,
      link: item.link,
      source,
      publishedAt: item.isoDate || item.pubDate || null,
      contentSnippet: item.contentSnippet?.slice(0, 300) || "",
      image: extractImage(item),
    }));
  } catch (err) {
    console.error(`[news] fallo al leer feed de ${source} (${url}):`, err.message);
    return [];
  }
}

export async function getNews() {
  const cached = cache.get("news:feeds");
  if (cached !== undefined) return cached;

  const results = await Promise.all(config.newsFeeds.map(fetchFeed));
  const items = results.flat();
  items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const news = items.slice(0, 30);

  // No cachear un resultado vacío: probablemente fue un fallo temporal de red/RSS,
  // no que de verdad no haya noticias. Así el próximo request reintenta pronto.
  if (news.length > 0) {
    cache.set("news:feeds", news, config.cacheTtl.news);
  }
  return news;
}

export async function getNewsForCoin(coinName, coinSymbol) {
  const all = await getNews();
  const filtered = filterNewsByCoin(all, coinName, coinSymbol);
  return (filtered.length ? filtered : all).slice(0, 10);
}

export function filterNewsByCoin(newsItems, coinNameOrSymbol, coinSymbol) {
  const needles = [coinNameOrSymbol, coinSymbol]
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  return newsItems.filter((item) => {
    const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
    return needles.some((needle) => text.includes(needle));
  });
}
