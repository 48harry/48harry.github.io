---
layout: post
title: BDAI 데이터 분석 실전반 추천 시스템 구현 3주차 Review (13기)
subtitle: BDAI
tags:
  - bdai
comments: false
mathjax: true
author: Geunyeong Cho
published: false
date: 2026-09-16 14:23:38 +0900
---
# BDAI학회 (빅데이터 분석 학회, 대학생 학회) 3주차 강의 후기

# 1. 이번 주 배운것

### Train-Test Split methods

##### 개념

백테스트 : 과거기록으로 전략을 미리 시험해봄 (시간순 분할 / time series split)
##### 금융도메인 용어

선행편향 : 금융도메인에서의 데이터누수
생존편향 : 사라진 종목을 빼고 세면 수익률이 좋아보인다고 착각하게 되는것
투자자성향 진단 : 법적으로 정해진 의무질문사항

##### Cold-start 처리

1. train데이터에 기록이 없고 test데이터에만 있는 사람을 골라낸다
2. 기존-신규 두 무리로 갈라서 확인한다 (본 프로젝트에서 신규는 전체 사용자의 6%)
3. 각 무리의 성적을 확인하고 적합한 방법을 통해 신규 사용자에 대해 제안한다 (이 부분은 엔지니어의 역량)
	1. 전체 인기목록에서 높은 순위를 제공한다 : 러프하게 맞아보이지만 1주차와 다를게 없음
	2. 위험도 중간값을 제공한다 : 사용자의 피쳐를 파악하지 못한 서비스
	3. etc... 기타 methods
##### 정리

- 전부 기존에 알고있던 내용이라서 조금 지루하게 느껴졌다

- Cold-start 처리는 모델학습에 있어서 (특히 예측/추천모델의 경우) 굉장히 중요하기에 현업에서는 어떻게 해당 유형의 문제에 접근하는지에 대한 아이디어나 관련된 논문등 좀 더 심화된 내용을 다뤘으면 어땠을까 하는 아쉬움이 있다. 그래서 추가조사를 진행해보았다.

---

##### 추가) 현업 예측/추천 시스템에서 Cold-Start 문제를 어떻게 처리하는가

1. 현업에서는 단일 모델만으로 이 문제를 해결하려 하지 않고, "신규 유저"와 "신규 아이템"을 구분한다. 
2. **온보딩, 멀티 캐너디딧 후보군 조합, 탐색알고리즘, 그리고 메타데이터 기반 하이브리드 임베딩**을 복합적으로 결합하여 대응한다.

###### 1. Item Cold-Start 대처법 (신규 상품/콘텐츠가 등록되었을 때)
상호작용(클릭, 구매, 좋아요 등) 이력이 전혀 없는 신규 아이템을 기존 추천 알고리즘에 편입시킨다

**메타데이터 기반 하이브리드 임베딩 (Two-Tower Architecture)**

- **원리:** 아이템의 텍스트(제목, 설명), 이미지, 범주형 태그 등 메타데이터를 활용해 임베딩을 즉시 생성한다

- **현업 구조:** **Two-Tower Neural Network** 구조(User Tower와 Item Tower 분리)를 주로 사용한다
    - 기존 협업 필터링은 유저 반응이 있어야 벡터가 형성되지만, Two-Tower 모델의 Item Tower는 신규 상품의 메타데이터(텍스트/이미지 벡터)만 입력받아도 기존 아이템들과 동일한 차원의 임베딩 공간에 바로 좌표를 할당한다
    - 생성된 아이템 벡터는 Vector DB(FAISS, Milvus 등)에 인덱싱되어 즉시 검색 및 추천 후보군에 포함된다

**Multi-Armed Bandit (MAB) 기반 노출 및 탐색**

- **원리:** 신규 아이템이 유저 반응을 얻지 못하면 계속 피드백이 누적되지 않는 악순환을 끊기 위해 의도적인 노출 지분을 할당한다.

- **알고리즘:**
    - **Thompson Sampling** 또는 **UCB (Upper Confidence Bound):** 불확실성(데이터가 적음)이 높은 신규 아이템에 가산점을 부여하여 일정 확률로 유저에게 노출시킨다.
	- 유저 피드백(클릭/구매)이 들어오면 불확실성이 줄어들며 제자리를 찾고, 반응이 없으면 노출 순위가 점차 낮아지는 방식으로 자율 제어된다.

**유사 아이템 / 클러스터 centroid 할당**

- **원리:** 완전히 새로운 아이템이 들어오면, 카테고리나 브랜드가 같은 기존 성공 아이템들의 평균 벡터를 초기 임베딩으로 부여하는 단순하면서도 강력한 룰베이스 방식을 병행한다.

###### 2. User Cold-Start 대처법 (신규 유저가 가입했거나 비로그인 유저일 때)
유저의 과거 행동 이력이 존재하지 않을 때 적용하는 접근법

**온보딩(Onboarding) & Contextual Baseline**

- **온보딩 룰:** 가입 시 선호 카테고리, 관심 태그를 3~5개 선택하도록 유도하여 초기 프로필을 구성합니다.
- **맥락 기반 추천:** 로그인 이력이 없더라도 접속 기기, 접속 지역, 시간대, 유입 채널(광고/검색/지인 추천) 등의 컨텍스트 정보만으로 유저 그룹을 파악해 해당 그룹 내 인기 상품을 먼저 노출한다.

**실시간 세션 기반 추천**

- **원리:** 과거 장기 기록이 없어도 "방금(현재 세션) 클릭한 2~3개의 행동 이력"만으로 유저의 실시간 의도를 파악한다.
- **알고리즘:** (**GRU4Rec, SASRec, Transformer/Self-Attention**) 기반 세션 모델을 사용하여 유저가 방금 본 상품들과 유사성이 높은 아이템을 실시간 연관 추천으로 밀어준다.

###### 3. 현업 추천 시스템의 표준 아키텍처 (2-Stage 시스템에서의 흡수)

- 현업의 머신러닝/딥러닝 추천 시스템은 대부분 다음의 2-stage 방법을 채택한다

```
[ 전체 아이템 (수백만 개) ]
         │
         ▼
[ Candidate Generation (Retrieval) ]  ───►  Cold 유저/아이템은 Content/Popularity 채널에서 수집
  - Multi-Source Candidate Retrieval
    - Ch 1: Collaborative Filtering (Warm 유저/아이템)
    - Ch 2: Content-Based Filtering (Cold 아이템 대응)
    - Ch 3: Demographic / Popularity (Cold 유저 대응)
    - Ch 4: MAB Exploration Slot (신규 아이템 탐색)
         │
         ▼  (상위 수백 개 추출)
[ Ranking (LightGBM Ranker / DeepFM 등) ] ───►  상호작용 피처 + 정적 메타 피처를 함께 학습해 점수 산출
         │
         ▼  (최종 Top-K 추천)
[ User UI ]
```

1. Candidate Generation (Retrieval Stage):  
    - 단일 모델을 쓰지 않고 다중 채널(Multi-Source)에서 후보를 긁어온다.
    - 협업 필터링 채널에서 Cold-Start 유저/아이템이 걸러지더라도, **Content-Based 채널, 인기순 채널, MAB 탐색 채널**에서 신규 유저/아이템 후보군을 일정 비율 확보해 상위 레이어로 올려보낸다.

2. Ranking Stage:
    - LightGBM Ranker, DeepFM, CatBoost 등의 모델이 후보군을 재정렬할 때 과거 클릭 수 같은 "상호작용 피처"뿐만 아니라 카테고리, 가격대, 유저 연령대 같은 "정적 메타 피처"를 비중 있게 반영하여 Cold 아이템도 정량적 스코어를 받아 상위에 오를 수 있도록 방어한다.

# 2. BDAI LMS의 유용한 기능

[BDAI LMS](https://bdai.co.kr/dashboard/)

1. AI 캠퍼스맵
![[Pasted image 20260922131332.png]]



2. 현직자 커피챗
![[Pasted image 20260922131231.png]]

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