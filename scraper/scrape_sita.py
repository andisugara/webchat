#!/usr/bin/env python3
"""
SITA Badung Web Scraper (Python)
Crawl portal sita.badungkab.go.id, ekstraksi data pariwisata, acara, destinasi,
dan kirim ke Knowledge Base API / Database PostgreSQL.
"""

import os
import sys
import json
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE_URL = "https://sita.badungkab.go.id"
API_URL = os.getenv("API_URL", "http://localhost:8000/api/knowledge")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

CATEGORIES_MAP = {
    "destinasi": "destinasi",
    "industri": "akomodasi",
    "acara": "acara",
    "desawisata": "destinasi",
    "berita": "umum",
}

def clean_text(text: str) -> str:
    if not text:
        return ""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    return " ".join(lines)

def scrape_page_detail(url: str) -> str:
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code != 200:
            return ""
        soup = BeautifulSoup(res.text, "html.parser")
        
        # Look for article body or main content
        content_div = soup.find("article") or soup.find("main") or soup.find("div", class_="content")
        if content_div:
            # Remove scripts, navs, footers
            for tag in content_div(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            return clean_text(content_div.get_text())
        return ""
    except Exception as e:
        print(f"⚠️ Warning scraping detail {url}: {e}")
        return ""

def scrape_sita():
    print(f"🚀 Memulai Python Scraper untuk Portal SITA Badung ({BASE_URL})...")
    
    collected_articles = []
    
    endpoints = [
        ("/", "umum"),
        ("/destinasi", "destinasi"),
        ("/acara", "acara"),
        ("/industri", "akomodasi"),
        ("/desawisata", "destinasi"),
    ]
    
    for path, default_cat in endpoints:
        target_url = urljoin(BASE_URL, path)
        print(f"🔎 Mengambil halaman: {target_url}...")
        try:
            res = requests.get(target_url, headers=HEADERS, timeout=12)
            if res.status_code != 200:
                print(f"❌ Gagal mengambil {target_url} (HTTP {res.status_code})")
                continue
                
            soup = BeautifulSoup(res.text, "html.parser")
            
            # Find cards (.event, .post, article, item)
            cards = soup.select(".event, .post, article .item, .box-body")
            print(f"   -> Ditemukan {len(cards)} kartu item pada {path}")
            
            for card in cards:
                title_tag = card.find(["h2", "h3", "h4", "a"])
                if not title_tag:
                    continue
                
                title = title_tag.get_text().strip()
                if len(title) < 5 or title.lower() in ["beranda", "destinasi", "acara", "industri"]:
                    continue
                
                link_tag = card.find("a")
                href = link_tag.get("href") if link_tag else ""
                full_url = urljoin(BASE_URL, href) if href else target_url
                
                # Extract category if available
                cat_tag = card.find(class_=["lokasi", "caption", "status", "category"])
                cat_text = cat_tag.get_text().strip().lower() if cat_tag else default_cat
                
                category = "destinasi"
                if "acara" in cat_text or "event" in cat_text:
                    category = "acara"
                elif "akomodasi" in cat_text or "hotel" in cat_text or "kuliner" in cat_text:
                    category = "akomodasi"
                elif "layanan" in cat_text or "fasilitas" in cat_text:
                    category = "layanan"
                
                # Try fetching deeper detail or use snippet
                detail_text = scrape_page_detail(full_url)
                if not detail_text or len(detail_text) < 50:
                    detail_text = f"{title}. Informasi pariwisata resmi dari Kabupaten Badung, Bali. Kunjungi portal resmi SITA Badung untuk jadwal dan informasi terkini."
                
                collected_articles.append({
                    "title": title,
                    "category": category,
                    "sourceUrl": full_url,
                    "rawContent": detail_text,
                })
        except Exception as e:
            print(f"⚠️ Error saat scraping {target_url}: {e}")

    # Remove duplicates by title
    unique_items = {}
    for item in collected_articles:
        if item["title"] not in unique_items:
            unique_items[item["title"]] = item

    final_list = list(unique_items.values())
    print(f"\n✅ Total {len(final_list)} artikel pariwisata unik berhasil dikumpulkan.")

    # Send to Backend API
    success_count = 0
    for item in final_list:
        try:
            api_res = requests.post(API_URL, json=item, timeout=10)
            if api_res.status_code in [200, 201]:
                success_count += 1
                print(f"  [+] Ingested & Embedded: {item['title'][:50]}...")
            else:
                print(f"  [-] Gagal kirim API ({api_res.status_code}): {item['title'][:30]}")
        except Exception as e:
            print(f"  [-] Error mengirim ke API: {e}")

    print(f"\n🎉 Selesai! Berhasil menyimpan dan meng-embed {success_count}/{len(final_list)} dokumen ke database.")

if __name__ == "__main__":
    scrape_sita()
