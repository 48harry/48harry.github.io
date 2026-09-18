---
layout: post
title: BDAI 데이터 분석 실전반 추천 시스템 구현 2주차 Review (13기)
subtitle: BDAI
tags:
  - bdai
comments: false
mathjax: true
author: Geunyeong Cho
published: true
date: 2026-09-14 14:23:38 +0900
---
# BDAI학회 (빅데이터 분석 학회, 대학생 학회) 2주차 강의 후기


# 1. 이번 주 배운것


### 규칙기반 (섹터기반 레버리지 판단) 추천


##### 금융 도메인 용어

섹터 : 종목이 속한 산업분야
위험도 : 위험선호도
세그먼트 : 취향이 비슷한 사용자 집단
매핑 : 본 프로젝트에의 종목명과 위험도를 하나로 붙이는 작업

##### 워크플로우

1. 매핑을 통해 종목명-위험도 를 하나의 세그먼트로 나눈다
2. 개별 종목을 세그먼트별로 나눈다 (주력섹터)
3. 사용자 각각의 포트폴리오 내 종목들의 위험도 평균값을 구한다 (위험선호도)
4. 주력섹터와 위험선호도를 기반으로 대표값을 추천한다 (세그먼트 별 추천)

##### 평가 metrics

본 프로젝트에서는 10개의 상품을 추천한다. 특성과 상황에 맞게 적합한 metric을 유연하게 사용해야한다

- **Precision@10** : 맞힌 개수 / **우리가 준 것** — 헛것을 주면 감점
- **Recall@10** : 맞힌 개수 / **그 사람이 담은 개수** — 놓치면 감점
- **NDCG@10** : 맞힌 **자리 (순위)까지** 봅니다 (위에서 맞히면 많이, 아래에서 맞히면 적게 줍니다)

##### 유의점

- 반드시 세그먼트를 잘게 나눈다고 해서 좋은 성능을 보장하지 않는다

  > overfitting 위험, coldstart에 대해 유연하게 반응하기 어렵다
  
##### 정리

| 구분 | Precision@10 | Recall@10 | NDCG@10 |
| :--- | :--- | :--- | :--- |
| 1주차 · 모두에게 같은 목록 | 0.0801 | 0.2188 | 0.1722 |
| 2주차 · 세그먼트별 목록 | 0.0970 | 0.2773 | 0.1936 |

- 단순 순위기반 추천보다 진일보하였으나 여전히 같은 세그먼트 그룹의 사람은 identical한 추천리스트를 받는다는 문제점이 있다

  > 아직은 진정한 '추천 시스템'으로 보기엔 무리가 있다

# 2. BDAI 공식 블로그

[BDAI 네이버 블로그](https://blog.naver.com/bdaxdml)

BDAI 관련된 발표자료, 여러가지 활동내용들이 올라와있다

![](/assets/img/Pasted%20image%2020260914224818.png)

![](/assets/img/Pasted%20image%2020260914224733.png)

채용시즌엔 이렇게 매주 채용공고도 보기 편하게 올려주는듯

![](/assets/img/Pasted%20image%2020260914231501.png)

서이추 한번 걸었더니 그냥 이웃신청은 안되네요

운영자님 이거 보시면 서이추 한번 받아주세요~ 감사합니다~^^**


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