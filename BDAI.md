---
layout: page
title: BDAI
subtitle: 데이터 분석 실전반 추천 시스템 구현 회고 (13기)
permalink: /bdai/
---

{%- comment -%} A series reads in order: week 1 first, each row titled with that week's topic (its subtitle) {%- endcomment -%}
{%- assign bdai_posts = site.tags.bdai | sort: "date" -%}

<ol class="post-rows post-rows-series">
  {% for post in bdai_posts %}
    {%- capture week %}{{ forloop.index }}주차{% endcapture -%}
    {% include post-row.html post=post num=week title=post.subtitle nodesc=true %}
  {% endfor %}
</ol>
