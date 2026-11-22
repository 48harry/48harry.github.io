import os
import re
import time
from datetime import datetime, timezone, timedelta
import requests
from google import genai
from google.genai import errors, types

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

KST = timezone(timedelta(hours=9))
now_kst = datetime.now(KST)
date_str = now_kst.strftime("%Y-%m-%d")
# 글 시각은 매일 09:00으로 통일. 9시 전에 수동 실행하면 미래 시각이 되어 글이 숨겨지므로 실제 시각을 씀
post_time = min(now_kst, now_kst.replace(hour=9, minute=0, second=0, microsecond=0))
datetime_jekyll = post_time.strftime("%Y-%m-%d %H:%M:%S +0900")


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
    # timeout은 밀리초 단위(요청당 2분). SDK 자체 재시도는 끄고 call_gemini에서 직접 재시도
    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(timeout=120_000, retry_options=types.HttpRetryOptions(attempts=1)),
    )
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
keywords: ["키워드1", "키워드2", "키워드3", "키워드4"]
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

7. keywords에는 블로그 홈 화면에서 이 글의 각 기사로 바로 찾아 들어가는 짧은 키워드를 4~5개 넣을 것.
   - 기사마다 1개 이상, 제품·프로젝트·회사 이름(예: OpenDLSS, Gemini 4)이나 짧은 주제어(예: 오픈소스, 업스케일링)로.
   - 각 키워드는 본문에서 그 기사의 ### 제목이나 요약에 쓴 표기 그대로(대소문자, 띄어쓰기까지) 쓸 것.
   - 키워드마다 큰따옴표로 감싸고, 키워드 안에는 따옴표, 쉼표, 콜론, &를 쓰지 말 것.
"""
    blog_md = call_gemini(client, prompt)
    return normalize_post(blog_md)


# 기본 모델이 과부하(503)/한도초과(429)/없음(404)이면 API가 알려주는 다른 flash 모델로 넘어감
PRIMARY_MODEL = "gemini-3.8-flash"
RETRYABLE = {429, 500, 503, 504}
SKIP_WORDS = ("preview", "exp", "image", "tts", "audio", "live", "embedding", "thinking")


def fallback_models(client, limit=3):
    """이 API 키로 쓸 수 있는 텍스트용 flash 모델을 최신 버전 순으로 반환"""
    try:
        names = [
            m.name.removeprefix("models/")
            for m in client.models.list()
            if "generateContent" in (m.supported_actions or [])
        ]
    except Exception as e:
        print(f"      모델 목록 조회 실패: {e}", flush=True)
        return []
    flash = sorted(
        (n for n in names if "flash" in n and n != PRIMARY_MODEL and not any(w in n for w in SKIP_WORDS)),
        reverse=True,
    )
    print(f"      대체 후보: {flash[:limit]}", flush=True)
    return flash[:limit]


def call_gemini(client, prompt, attempts_per_model=3):
    last_error = None
    models = [PRIMARY_MODEL]
    tried_listing = False
    while models:
        model = models.pop(0)
        for attempt in range(1, attempts_per_model + 1):
            try:
                print(f"      {model} 시도 {attempt}/{attempts_per_model}", flush=True)
                text = client.models.generate_content(model=model, contents=prompt).text
                if text and text.strip():
                    return text.strip()
                last_error = RuntimeError(f"{model}: 빈 응답")
            except errors.APIError as e:
                last_error = e
                print(f"      → {e.code} {e.status}", flush=True)
                if e.code not in RETRYABLE:
                    break  # 404 등은 재시도해도 소용없음 → 다음 모델
            except Exception as e:  # 타임아웃 등 네트워크 오류
                last_error = e
                print(f"      → {type(e).__name__}: {e}", flush=True)
            if attempt < attempts_per_model:
                time.sleep(15 * attempt)
        if not models and not tried_listing:
            tried_listing = True
            models = fallback_models(client)
    raise RuntimeError(f"모든 Gemini 모델 실패: {last_error}")


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
    post_path = f"_posts/{date_str}-hacker-news-daily.md"
    dry_run = os.environ.get("DRY_RUN") == "true"
    if os.path.exists(post_path) and os.environ.get("FORCE") != "true" and not dry_run:
        print(f"{post_path} 이미 있음 → 건너뜀 (덮어쓰려면 force로 수동 실행)", flush=True)
        raise SystemExit(0)
    print("[1/4] Hacker News 수집 중...", flush=True)
    articles = fetch_hacker_news(top_n=3)
    print(f"      {len(articles)}개 기사: {[a['title'] for a in articles]}", flush=True)
    print("[2/4] 명언 수집 중...", flush=True)
    quote = fetch_quote()
    print("[3/4] Gemini로 포스트 생성 중...", flush=True)
    blog_md = generate_blog_post(articles, quote)
    print(f"      {len(blog_md)}자 생성 완료", flush=True)
    print("[4/4] 저장", flush=True)
    save_blog_post(blog_md)