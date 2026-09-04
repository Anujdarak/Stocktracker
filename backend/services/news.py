import asyncio
import feedparser
from bs4 import BeautifulSoup
from typing import List, Dict, Any
import ssl
import time

# Define the feed URLs
RSS_FEEDS = [
    "https://www.moneycontrol.com/rss/MCtopnews.xml",
    "https://www.moneycontrol.com/rss/business.xml",
    "https://economictimes.indiatimes.com/markets/rssfeeds/2146842.cms",
    "https://economictimes.indiatimes.com/industry/rssfeeds/13352306.cms",
    "https://www.livemint.com/rss/markets"
]

def clean_html(raw_html: str) -> str:
    """Remove HTML tags from a string to create a clean snippet."""
    if not raw_html:
        return ""
    try:
        soup = BeautifulSoup(raw_html, "lxml")
        return soup.get_text(separator=' ', strip=True)
    except Exception:
        # Fallback if lxml is missing or errors
        soup = BeautifulSoup(raw_html, "html.parser")
        return soup.get_text(separator=' ', strip=True)

def parse_feed(url: str) -> List[Dict[str, Any]]:
    """Fetch and parse a single RSS feed."""
    try:
        # ssl context to avoid ssl errors on some feeds
        if hasattr(ssl, '_create_unverified_context'):
            ssl_context = ssl._create_unverified_context()
        else:
            ssl_context = None

        handlers = []
        if ssl_context:
            import urllib.request
            https_handler = urllib.request.HTTPSHandler(context=ssl_context)
            handlers.append(https_handler)

        feed = feedparser.parse(url, handlers=handlers)

        articles = []
        for entry in feed.entries:
            # Get the best snippet/summary
            summary = getattr(entry, 'summary', '')
            if not summary and hasattr(entry, 'description'):
                summary = getattr(entry, 'description', '')

            snippet = clean_html(summary)
            # Truncate if too long
            if len(snippet) > 200:
                snippet = snippet[:197] + "..."

            # Get published date, fallback to now if missing
            published = getattr(entry, 'published', getattr(entry, 'pubDate', ''))
            timestamp = 0
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                timestamp = time.mktime(entry.published_parsed)

            title = getattr(entry, 'title', 'No Title')
            link = getattr(entry, 'link', '')

            articles.append({
                "title": title,
                "link": link,
                "published": published,
                "timestamp": float(timestamp),
                "snippet": snippet,
                "source": getattr(feed.feed, 'title', url)
            })
        return articles
    except Exception as e:
        print(f"Error parsing feed {url}: {e}")
        return []

class NewsService:
    @staticmethod
    async def get_latest_news() -> List[Dict[str, Any]]:
        """Fetch and aggregate latest news from all sources."""
        # Use run_in_executor to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(None, parse_feed, url)
            for url in RSS_FEEDS
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_articles = []
        for res in results:
            if isinstance(res, list):
                all_articles.extend(res)

        # Sort by timestamp descending (newest first)
        all_articles.sort(key=lambda x: x.get("timestamp", 0), reverse=True)

        # Deduplicate by link or title, keep newest
        seen_links = set()
        deduped = []
        for article in all_articles:
            link = article.get("link")
            if not link or link not in seen_links:
                if link:
                    seen_links.add(link)
                deduped.append(article)

        return deduped

    @staticmethod
    async def search_news(query: str) -> List[Dict[str, Any]]:
        """Fetch all news and filter by a specific query (company/sector-specific)."""
        all_news = await NewsService.get_latest_news()
        query_lower = query.lower()

        filtered = []
        for article in all_news:
            title = article.get("title", "").lower()
            snippet = article.get("snippet", "").lower()
            if query_lower in title or query_lower in snippet:
                filtered.append(article)

        return filtered
