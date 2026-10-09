---
layout: page
title: Daily Newsletters
subtitle: 매일 아카이빙되는 테크 뉴스
permalink: /newsletters/
---

{%- comment -%}
  initNewsCalendar in custom.js builds the month calendar from #news-data and
  adds the 달력/목록 switch; without JS the card list below is all there is.
  Excerpts in #news-data are plain text: strip_html leaves kramdown's &amp; &lt; &gt;
  entities, so they're decoded (before truncate, which could split one) and
  custom.js escapes the text itself.
{%- endcomment -%}

<div class="nl-view" data-view="list">
  <script>
    // Pick the view before first paint so the long card list doesn't flash before the calendar.
    // If custom.js never builds the calendar (blocked, failed), fall back to the list once loaded.
    (function (view) {
      var v = "calendar";
      try { if (localStorage.getItem("newsView") === "list") v = "list"; } catch (e) {}
      view.setAttribute("data-view", v);
      window.addEventListener("load", function () {
        if (view.querySelector(".cal").hidden) view.setAttribute("data-view", "list");
      });
    })(document.currentScript.parentNode);
  </script>
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
  {"d":{{ p.date | date: "%Y-%m-%d" | jsonify }},"t":{{ p.title | strip_html | jsonify }},"u":{{ p.url | relative_url | jsonify }},"e":{{ p.excerpt | strip_html | strip_newlines | replace: "&lt;", "<" | replace: "&gt;", ">" | replace: "&quot;", '"' | replace: "&#39;", "'" | replace: "&amp;", "&" | truncate: 140 | jsonify }}}{% unless forloop.last %},{% endunless %}
{%- endfor -%}]
</script>
