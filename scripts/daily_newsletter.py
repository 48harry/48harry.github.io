import os
import re
from datetime import datetime, timezone, timedelta
import requests
from google import genai

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

KST = timezone(timedelta(hours=9))
now_kst = datetime.now(KST)
date_str = now_kst.strftime("%Y-%m-%d")
datetime_jekyll = now_kst.strftime("%Y-%m-%d %H:%M:%S +0900")


def fetch_hacker_news(top_n=3):
    """Hacker News 상위 N개 기사 수집"""
    top_ids = requests.get("https://hacker-news.firebaseio.com/v0/topstories.json", timeout=10).json()
    articles = []
    for item_id in top_ids[:15]:
        item = requests.get(f"https://hacker-news.firebaseio.com/v0/item/{item_id}.json", timeout=10).json()
        if item and item.get("type") == "story" and item.get("url"):
            articles.append({
                "title": item.get("title"),
                "url": item.get("url"),
                "score": item.get("score", 0)
            })
        if len(articles) >= top_n:
            break
    return articles


def fetch_quote():
    """오늘의 명언 API 수집"""
    try:
        res = requests.get("https://zenquotes.io/api/today", timeout=10).json()
        return f'"{res[0]["q"]}" - {res[0]["a"]}'
    except Exception:
        return '"Simplicity is prerequisite for reliability." - Edsger W. Dijkstra'


def generate_blog_post(articles, quote):
    """Gemini API로 블로그용 Jekyll Markdown만 생성"""
    client = genai.Client(api_key=GEMINI_API_KEY)
    articles_text = "\n".join(
        [f"- 제목: {a['title']} / URL: {a['url']} / 점수: {a['score']}" for a in articles]
    )

    prompt = f"""
너는 데이터 분석, MLOps, AI 시스템 아키텍처를 전문으로 다루는 시니어 테크 엔지니어링 블로거야. 
아래 제공된 3개의 기사를 바탕으로 GitHub Pages(Jekyll)에 바로 올릴 수 있는 마크다운(.md) 포스트를 작성해 줘.

[기사 데이터]
{articles_text}

[오늘의 명언]
{quote}

[필수 출력 규칙 - 위반 시 에러 발생]
1. 맨 첫 줄은 무조건 --- 기호로 시작해야 하며, 절대로 백틱(```markdown)으로 감싸지 마.
2. YAML Front Matter의 각 항목은 반드시 아래와 같이 정확히 줄바꿈(Newline)을 적용해 줘:

---
layout: post
title: "[3개 기사의 핵심을 관통하는 매력적인 테크 제목]"
date: {datetime_jekyll}
categories: [Tech, News]
tags: [Hacker News, Tech Trend]
---

3. 본문 작성 및 기사 요약 규칙:
   - 도입부는 2~3줄로 오늘 다룰 핵심 주제를 흥미롭게 요약할 것.
   - 각 기사별로 아래 서식을 엄격히 준수하여 풍부한 내용으로 작성할 것:

   ### [기사 1 제목]
   - **원문 읽기:** [Hacker News 기사 링크 바로가기](기사1_URL)
   - **핵심 요약:**
     * (기사 핵심 내용 1 - 상세하게 작성)
     * (기사 핵심 내용 2 - 상세하게 작성)
     * (기사 핵심 내용 3 - 상세하게 작성)
   - **💡 데이터/AI 엔지니어의 시선:** (이 기술이나 소식이 AI, MLOps, 백엔드, 데이터 파이프라인 관점에서 어떤 의미를 갖는지 시니어 엔지니어의 깊이 있는 인사이트를 덧붙일 것. 추가할만한 설명이 있으면 자세하게 기술해도 좋아.)

4. 제목(title) 및 본문에 쌍따옴표(")를 중첩해서 사용하여 YAML 문법 에러가 나지 않도록 주의할 것.

5. 약간의 위트를 추가해도 좋아.

6. 자기소개는 생략하고 규칙에 따라서만 작성해줘. 네가 어떤 직군을 가지는지, 직업이 뭔지는 본문이나 제목에 설명할 필요가 없어.
"""
    blog_md = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt
    ).text.strip()

    return normalize_post(blog_md)


def normalize_post(blog_md):
    """코드펜스 제거, front matter 검증, date를 실행 시각으로 고정"""
    lines = blog_md.splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
    blog_md = "\n".join(lines).strip()

    match = re.match(r"^---\n(.*?)\n---\n", blog_md, re.DOTALL)
    if not match or "title:" not in match.group(1):
        raise ValueError(f"Gemini 응답에 올바른 front matter가 없습니다:\n{blog_md[:500]}")

    front = match.group(1)
    if re.search(r"^date:", front, re.MULTILINE):
        front = re.sub(r"^date:.*$", f"date: {datetime_jekyll}", front, flags=re.MULTILINE)
    else:
        front += f"\ndate: {datetime_jekyll}"
    return f"---\n{front}\n---\n" + blog_md[match.end():]


def save_blog_post(markdown_content):
    """Jekyll _posts 폴더에 마크다운 파일 저장 (DRY_RUN이면 출력만)"""
    if os.environ.get("DRY_RUN") == "true":
        print(markdown_content)
        print("DRY_RUN: 파일을 저장하지 않았습니다.")
        return
    os.makedirs("_posts", exist_ok=True)
    filename = f"_posts/{date_str}-hacker-news-daily.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(markdown_content + "\n")
    print(f"블로그 포스트 저장 완료: {filename}")


if __name__ == "__main__":
    articles = fetch_hacker_news(top_n=3)
    quote = fetch_quote()
    blog_md = generate_blog_post(articles, quote)
    save_blog_post(blog_md)