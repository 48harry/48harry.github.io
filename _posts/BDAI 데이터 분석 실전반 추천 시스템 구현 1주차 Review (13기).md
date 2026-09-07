---
layout: post
title: BDAI 데이터 분석 실전반 추천 시스템 구현 1주차 Review (13기)
subtitle: BDAI 회고
tags:
  - article
comments: false
mathjax: true
author: Geunyeong Cho
published: true
date: 2026-09-07 18:56:31 +0900
---
## 1. 수업에서 배운 내용 및 느낀 점

1주차라서 대단한걸 배우진 않았다 (혹은 알고있던것들)
#### EDA
matplotlib, pandas 등

#### 금융데이터
사실 추천시스템 구축한다고할때 그냥 뻔한 협업필터링 활용한 프로젝트 진행할줄 알았는데 갑자기 금융상품 추천하는걸 구축할거라고 해서 당황했다 (커리큘럼상에도 그런 내용은 없었음)
근데 금융도메인도 평소에 다뤄보고싶었는데 이번에 다뤄볼 수 있어서 좋은 경험이 될것같다 (비록 pesudo dataset이긴 하지만 metric이나 model같은건 실제로 금융도메인에 활용 가능한 내용을 다루게 될것같음)

#### 성능평가
train-test split : 12개월치를 11-1로 분할해서 활용할것임 >> 데이터가 계절성 띄면 문제가 발생하지 않을까 하는 우려..?

metric : recall (그 사람이 실제로 산 n개의 종목중에 내가 예측한 k개의 예측에서 몇개를 예측했는가 비율) 의 평균

#### 모듈화
앞으로 10주간 모듈 하나를 만들어두고 계속해서 거기에 덧붙여가는 방식으로 프로젝트를 진행하게 될 예정인것같다. 

#### 1주차 모델
아직은 pandas만 활용해 dataframe, series, dictionary로 정리-정렬하고 단순출력하는 간단한 모듈이다. 여기에 앞으로 여러 통계기법을 활용해 추천시스템을 완성해 나갈 여정이 기대된다. (baseline : recall / 0.2188)

## 2. 앞으로 BDAI 활동을 통해 기대하는 점과 목표·다짐

이번에 처음으로 BDAI학회 (빅데이터 분석 학회, 대학생 학회)에 가입해 활동을 시작하는만큼 정규 학회수업은 물론이고 추후 조별활동에도 열심히 임해보도록 하겠다.

오늘부터 러닝크루? (running X learning O) 도 모집하던데 여기서 팀을 꾸려 학습도 같이하고 공모전 준비도 같이해서 나가보도록 하겠다.

원래 ML모델 심화과정을 신청했었는데 폐강이 되어 반강제로 추천시스템 구축반으로 옮기게 되었는데 원래 이 과정도 선택지에 있었어서 앞으로가 기대된다.

1주차라 기초적인것부터 시작해서 그런걸지 모르겠지만 기대했던것보다 너무 elemantary한것만 강의내용에 있던데, 앞으로 남은 9시간동안 어떻게 추천시스템 구현을 소개해주실지가 약간 걱정되긴 한다만.. 일단 주어진 강의에는 열심히 참여하도록 하겠다.
 
#BDAI #데이터분석 #데이터분석학회 #대학생학회 #취업 #취업준비 #대외활동 #대학생활 #수업후기

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