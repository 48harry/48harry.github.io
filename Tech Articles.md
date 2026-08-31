---
layout: page
title: Tech Articles
subtitle: 직접 탐구하고 작성한 기술 및 프로젝트 기록
permalink: /articles/
---

<div class="posts-list">
  {% for post in site.posts %}
    {% unless post.categories contains "News" %}
      <article class="post-preview">
        <a href="{{ post.url | relative_url }}">
          <h2 class="post-title">{{ post.title }}</h2>
          {% if post.subtitle %}
            <h3 class="post-subtitle">{{ post.subtitle }}</h3>
          {% endif %}
        </a>
        <p class="post-meta">
          Posted on {{ post.date | date: "%B %-d, %Y" }}
        </p>
        <div class="post-entry">
          {{ post.excerpt | strip_html | truncatewords: 30 }}
          <a href="{{ post.url | relative_url }}" class="post-read-more">[Read More]</a>
        </div>
      </article>
    {% endunless %}
  {% endfor %}
</div>