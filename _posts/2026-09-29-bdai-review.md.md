---
layout: post
title: BDAI 데이터 분석 실전반 추천 시스템 구현 5주차 Review (13기)
subtitle: BDAI
tags:
  - bdai
comments: false
mathjax: true
author: Geunyeong Cho
published: false
date: 2026-09-27923:23:38 +0900
---
# BDAI학회 (빅데이터 분석 학회, 대학생 학회) 5주차 강의 후기

# 1. 이번 주 배운것

### two-stage 추천

two-tower : 사람쪽, 종목쪽 따로 계산해서 저장해두고 비교
nearest neigbor : 가까운것만 찾는 방법

2단계추천 매커니즘 적용
1. 전체 100개의 종목 중 추천할 40개의 후보를 추림
2. 40개의 점수를 매기고 상위 10개만 추천 (recall@10)

핵심
1. 1단계에서 선정된 내용만이 2단계를 거쳐 추천될 수 있다
2. 파라미터를 조정하며 내용을 연산량, 계산속도를 줄일 수 있다
3. 후보를 몇개 추릴건지에 따라 품질과 시간이 달라짐. recall과 연산량의 tradeoff (일반적으로는 후보를 줄일수록 recall이 저하)

이번주차는 모델의 성능을 올리기보다는 모델을 최적화하고 tradeoff를 잡는데에 초점을 맞췄음

# 2. 블챌


#BDAI
#데이터분석
#데이터분석학회
#대학생학회
#취업
#취업준비
#대외활동
#대학생활
#수업후기

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