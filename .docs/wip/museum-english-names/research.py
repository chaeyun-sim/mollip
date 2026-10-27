import concurrent.futures
import html
import json
import pathlib
import re
import urllib.request
import urllib.parse

ROOT = pathlib.Path(__file__).parent

def fetch(row):
    url = (row['homepage_url'] or '').strip()
    result = dict(row)
    if not url:
        return result
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as response:
            raw = response.read(1500000)
            charset = response.headers.get_content_charset()
            if not charset:
                match = re.search(rb'charset=["\s]*([\w-]+)', raw[:10000], re.I)
                charset = match.group(1).decode() if match else 'utf-8'
            page = raw.decode(charset, errors='replace')
            result['resolved_url'] = response.url
        titles = re.findall(r'<title[^>]*>(.*?)</title>', page, re.I | re.S)
        metas = re.findall(r'<meta\b[^>]*>', page, re.I)
        selected = [m for m in metas if re.search(r'(og:site_name|og:title|description|application-name)', m, re.I)]
        alts = re.findall(r'\balt\s*=\s*["\']([^"\']{2,160})["\']', page, re.I)
        clean = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', ' ', page, flags=re.I | re.S)
        clean = html.unescape(re.sub(r'<[^>]+>', ' ', clean))
        chunks = [re.sub(r'\s+', ' ', s).strip() for s in re.split(r'[\n\r\t]', clean)]
        english = [s for s in chunks if re.search(r'[A-Za-z]{3}', s) and len(s)<250]
        links = []
        for href, label in re.findall(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', page, re.I | re.S):
            label = re.sub(r'<[^>]*>', ' ', label).strip()
            if re.search(r'English|^EN$|영문|영어',label,re.I) or re.search(r'/(eng|en|english)(/|\?|$)|[?&](lang|language)=(eng|en)',href,re.I):
                link = urllib.parse.urljoin(result['resolved_url'],html.unescape(href))
                if link.startswith(('http://','https://')) and link not in links: links.append(link)
        result.update(titles=titles, metadata=selected[:8], alts=list(dict.fromkeys(alts))[:50], english=list(dict.fromkeys(english)), english_links=links[:5])
    except Exception as error:
        result['error'] = str(error)
    return result

if __name__ == '__main__':
    rows = json.loads((ROOT / 'before.json').read_text())
    if (ROOT / 'english-targets.json').exists():
        rows = json.loads((ROOT / 'english-targets.json').read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
        results = list(pool.map(fetch, rows))
    (ROOT / 'homepage-research.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print('Researched',len(results),'sites; fetched',sum('titles' in r for r in results))
