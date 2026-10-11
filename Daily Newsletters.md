---
layout: page
title: 뉴스레터
subtitle: 매일 아카이빙되는 테크 뉴스
permalink: /newsletters/
---

{%- comment -%}
  initNewsCalendar in custom.js builds the month calendar from #news-data and
  adds the 달력/목록 switch; without JS the list below is all there is.
  Excerpts in #news-data are plain text from excerpt.html (entities already decoded);
  custom.js escapes the text itself.
{%- endcomment -%}

<div class="nl-view" data-view="list">
  <script>
    // Pick the view before first paint so the long list doesn't flash before the calendar.
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
    <button type="button" class="nl-switch-btn" data-view="calendar" aria-pressed="false">{% include icon.html name="calendar" %} 달력</button>
    <button type="button" class="nl-switch-btn" data-view="list" aria-pressed="true">{% include icon.html name="list" %} 목록</button>
  </div>

  <section class="cal" aria-label="뉴스레터 달력" hidden></section>

  <ol class="post-rows nl-list">
    {% for post in site.categories.News %}
      {% include post-row.html post=post %}
    {% endfor %}
  </ol>
</div>

<script type="application/json" id="news-data">
[{%- for p in site.categories.News -%}
  {%- capture news_excerpt -%}{% include excerpt.html post=p length=140 %}{%- endcapture -%}
  {"d":{{ p.date | date: "%Y-%m-%d" | jsonify }},"t":{{ p.title | strip_html | jsonify }},"u":{{ p.url | relative_url | jsonify }},"e":{{ news_excerpt | jsonify }}}{% unless forloop.last %},{% endunless %}
{%- endfor -%}]
</script>
