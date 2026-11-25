---
layout: page
title: 아티클
subtitle: 기술 및 프로젝트 기록
permalink: /articles/
---

{%- assign article_posts = "" | split: "" -%}
{%- for post in site.posts -%}
  {%- include post-section.html post=post -%}
  {%- if section_key == "articles" -%}{%- assign article_posts = article_posts | push: post -%}{%- endif -%}
{%- endfor -%}

{%- comment -%} Sub-categories (sections whose parent is articles), as small pills above the list {%- endcomment -%}
{%- capture subcats -%}
  {%- for _s in site.data.sections -%}
    {%- if _s[1].parent == "articles" -%}
      {%- assign _sub_key = _s[0] -%}
      {%- assign _sub_posts = site.tags[_sub_key] -%}
      {%- if _sub_posts.size > 0 -%}
    <a class="tag-pill" href="{{ _s[1].url | relative_url }}">{{ _s[1].name }} <span class="tag-count">{{ _sub_posts.size }}</span></a>
      {%- endif -%}
    {%- endif -%}
  {%- endfor -%}
{%- endcapture -%}
{%- assign subcats = subcats | strip -%}
{% if subcats != "" %}
<nav class="tag-cloud subcats" aria-label="하위 카테고리">{{ subcats }}</nav>
{% endif %}

<div class="posts-list">
  {% include post-card.html post=article_posts.first featured=true %}
</div>

<ol class="post-rows">
  {% for post in article_posts offset: 1 %}
    {% include post-row.html post=post %}
  {% endfor %}
</ol>
