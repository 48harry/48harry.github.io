---
layout: page
title: Daily Newsletters
subtitle: 매일 아카이빙되는 테크 뉴스
permalink: /newsletters/
---

<div class="posts-list">
  {% for post in site.categories.News %}
    <article class="post-preview">
      <a href="{{ post.url | relative_url }}">
        <h2 class="post-title">{{ post.title }}</h2>
      </a>
      <p class="post-meta">
        Archived on {{ post.date | date: "%B %-d, %Y" }}
      </p>
      <div class="post-entry">
        {{ post.excerpt | strip_html | truncatewords: 30 }}
        <a href="{{ post.url | relative_url }}" class="post-read-more">[Read More]</a>
      </div>
    </article>
  {% endfor %}
</div>
