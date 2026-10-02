---
layout: post
title: BDAI 데이터 분석 실전반 추천 시스템 구현 4주차 Review (13기)
subtitle: BDAI
tags:
  - bdai
comments: false
mathjax: true
author: Geunyeong Cho
published: false
date: 2026-09-22 23:23:38 +0900
---
# BDAI학회 (빅데이터 분석 학회, 대학생 학회) 4주차 강의 후기

# 1. 이번 주 배운것

### 유사도 행렬분해를 통한 규칙찾기 

recall@10 : 추천한 10개가 실제론 얼마나 맞췄나
유사도 : 요인값이 얼마나 가까운가

2주차 내용 : 같은 세그먼트 (예 : 지수|3 )의 사람들은 전부 같은 종목을 추천받음
이번엔 세그먼트를 나누는 기준을 모델에게 넘기겠다

상호작용행렬 : 사용자가 해당 종목을 담았다면 1, 아직 관찰되지 않았다면 0
목표 : 빈 값을 점수로 바꾸기 (내적을 통한 유사도 계산)

k개의 취향을 학습한다고 할때, k가 n에 가까워질수록 선택기록을 그대로 배끼고, 적절한 수로 두면 취향을 요약할 수 있음
Tradeoff : k가 커질수록 학습데이터에 대한 recall은 올라가지만 test 데이터에 대한 recall은 떨어지며, 용량도 커짐

유사도에서 양(+)과 음(-)은 상관관계의 영역
축으로 '행동의 방향'을 나타냄, 축 별로 의미를 가지니 EDA가 필요함

요인이 비슷할수록 비슷한 종목을 추천받음


# 2. BDAI 인스타그램 계정 팔로우 ㄱㄱ

![](/assets/img/Pasted%20image%2020261001221245.png)

https://www.instagram.com/official.bdai/

못가려서 미안한데 친구들이 팔로우를 꽤많이하고있다

그만큼 데이터분야 최전선 동아리 메이저한 킹갓 BDAI 당장 팔로우하러 가보자 ㅇㅇ...

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