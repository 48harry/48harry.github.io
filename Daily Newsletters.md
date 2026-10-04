---
layout: page
title: Daily Newsletters
subtitle: 매일 아카이빙되는 테크 뉴스
permalink: /newsletters/
---

{%- comment -%}
  initNewsCalendar in custom.js builds the month calendar from #news-data and
  adds the 달력/목록 switch; without JS the card list below is all there is.
{%- endcomment -%}

<div class="nl-view" data-view="list">
  <div class="nl-switch" role="group" aria-label="보기 방식" hidden>
    <button type="button" class="nl-switch-btn" data-view="calendar" aria-pressed="false"><i class="far fa-calendar" aria-hidden="true"></i> 달력</button>
    <button type="button" class="nl-switch-btn" data-view="list" aria-pressed="true"><i class="fas fa-list" aria-hidden="true"></i> 목록</button>
  </div>

  <section class="cal" aria-label="뉴스레터 달력" hidden></section>

  <div class="posts-list nl-list">
    {% for post in site.categories.News %}
      {% include post-card.html post=post %}
    {% endfor %}
  </div>
</div>

<script type="application/json" id="news-data">
[{%- for p in site.categories.News -%}
  {"d":{{ p.date | date: "%Y-%m-%d" | jsonify }},"t":{{ p.title | strip_html | jsonify }},"u":{{ p.url | relative_url | jsonify }},"e":{{ p.excerpt | strip_html | strip_newlines | truncate: 140 | jsonify }}}{% unless forloop.last %},{% endunless %}
{%- endfor -%}]
</script>
