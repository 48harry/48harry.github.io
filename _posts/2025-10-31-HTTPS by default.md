---
layout: post
title: HTTPS by default
subtitle: 
tags: [article]
comments: false
mathjax: true
author: Geunyeong Cho
published : true
---

2026년 10월 출시 예정인 Chrome 154부터 “Always Use Secure Connections” 설정이 기본으로 활성화된다
사용자가 최초로 HTTP로 접속 시 HTTPS 접속을 시도하며 HTTPS 미지원 시 사용자 허가를 구한 뒤 HTTP로 전환하도록 하는 것<br/>

현재 HTTPS로의 전환율이 이미 약 95 % 이상이지만 나머지 약 5 % 미만의 HTTP 접속도 여전히 “공격자가 침투 가능한 발판”이 된다는 판단에서 이런 업데이트를 추가하게 되는 것이다
변화의 핵심은 단순히 HTTPS 사용을 권장하는 수준을 넘어서 브라우저 수준에서 비 HTTPS 접속에 경고나 차단 같은 ‘디폴트 보안 태세'를 구현한다는 것이다<br/>

같은 HTTP 사이트에 대해 지나치게 여러 번 경고하지 않고 “새 사이트이거나 드물게 방문한 사이트일 경우에만” 경고하도록 설계하는 등의 UX와 보안 경고 사이의 균형을 고려하였다<br/>

내부 네트워크나 사내 인트라넷 등 HTTPS 인증서 확보가 어려운 환경에 대해서도 별도 고려가 있었다 
(로컬 네트워크 장치 접근 시 HTTPS로 마이그레이션할 수 있도록 접근 허가 기능이 강화)<br/>

HTTP만 지원하는 사이트는 2026년 이전에 HTTPS로 전환하지 않으면 사용자 접속 시 경고가 뜨거나 접속 저항이 생길 수 있게 된다
인증서 발급·갱신, TLS 구성, 리디렉션 정책 등이 더 이상 선택사항이 아니라 운영 리스크 관리 차원에서 필수 요소가 되는 것이다
(브라우저 벤더의 기본 보안 설정이 바뀌면 마이너 사이트나 레거시 인프라(ex: 구형 장비의 웹 인터페이스)가 디지털 격차에 빠질 가능성이 있다)<br/>

개발자 및 아키텍처 설계 입장에서 보면 더 이상 부가 보안 옵션이 아니라 모든 웹 애플리케이션 및 서비스의 기본 조건이 된다
데이터 흐름, 외부 API 호출, 리디렉션등의 고려가 더욱 중요해진다<br/>

사용자의 관점에서는 웹 탐색 시 “자동으로 안전한 연결인지 우선 시도되는가”가 새로운 기대치가 된다
“안전이 기본”이라는 인식 변화의 첫걸음인 셈<br/>

원문 : [https://security.googleblog.com/2025/10/https-by-default.html](https://security.googleblog.com/2025/10/https-by-default.html)<br/><br/>

<!-- 들어가며 예시
{: .box-success}
Box. -->

<!-- 링크첨부 예시
[This is a link to a different site](https://deanattali.com/) and [this is a link to a section inside this page](#local-urls). -->

<!-- 테이블형식 예시:

| Number | Next number | Previous number |
| :------ |:--- | :--- |
| Five | Six | Four |
| Ten | Eleven | Nine |
| Seven | Eight | Six |
| Two | Three | One | -->

<!-- MathJax 예시
When \\(a \ne 0\\), there are two solutions to \\(ax^2 + bx + c = 0\\) and they are $$x = {-b \pm \sqrt{b^2-4ac} \over 2a}.$$ -->

<!-- 사진첨부 예시
![부연설명](로컬주소)
가운데설정 하면
![부연설명](로컬주소){: .mx-auto.d-block :} -->

<!-- 코드첨부 예시
~~~
var foo = function(x) {
  return(x + 5);
}
foo(3)
~~~ -->

<!-- 코드첨부 (언어 반영 하이라이트) 예시
```javascript
var foo = function(x) {
  return(x + 5);
}
foo(3)
``` -->

<!-- 코드첨부 (번호 첨부) 예시
{% highlight javascript linenos %}
var foo = function(x) {
  return(x + 5);
}
foo(3)
{% endhighlight %} -->

<!-- ### 알림 예시
{: .box-note}
**Note:** This is a notification box. -->

<!-- ### 주의 예시
{: .box-warning}
**Warning:** This is a warning box. -->

<!-- ### 에러 예시
{: .box-error}
**Error:** This is an error box. -->

<!-- 요약 예시
<details markdown="1">
<summary>Click here!</summary>
요약문
</details> -->
