---
layout: page
title: 아티클
subtitle: 기술 및 프로젝트 기록
permalink: /articles/
---

{%- assign article_posts = "" | split: "" -%}
{%- for post in site.posts -%}
  {%- unless post.categories contains "News" or post.tags contains "bdai" -%}
    {%- assign article_posts = article_posts | push: post -%}
  {%- endunless -%}
{%- endfor -%}

<div class="posts-list">
  {% include post-card.html post=article_posts.first featured=true %}
</div>

<ol class="post-rows">
  {% for post in article_posts offset: 1 %}
    {% include post-row.html post=post %}
  {% endfor %}
</ol>
