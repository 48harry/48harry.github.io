---
layout: page
title: Tech Articles
subtitle: 기술 및 프로젝트 기록
permalink: /articles/
---

<div class="posts-list">
  {% for post in site.posts %}
    {% unless post.categories contains "News" or post.tags contains "bdai" %}
      {% include post-card.html post=post %}
    {% endunless %}
  {% endfor %}
</div>