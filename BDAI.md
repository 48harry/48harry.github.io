---
layout: page
title: BDAI
subtitle: BDAI 학회 관련 내용
permalink: /bdai/
---
<div class="posts-list">
{% for post in site.tags.bdai %}
  {% include post-card.html post=post %}
{% endfor %}
</div>
