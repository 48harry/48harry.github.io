---
layout: post
title: BDAI 데이터 분석 실전반 추천 시스템 구현 5주차 Review (13기)
subtitle: BDAI
tags:
  - bdai
mathjax: false
author: Geunyeong Cho
published: false
date: 2026-09-29 23:23:38 +0900
redirect_from:
  - /2026-09-29-bdai-review.md/
---
# BDAI학회 (빅데이터 분석 학회, 대학생 학회) 5주차 강의 후기

# 1. 이번 주 배운것

### two-stage 추천 메커니즘

용어
- two-tower : 사람쪽, 종목쪽 따로 계산해서 저장해두고 비교한다
- nearest neigbor : 가까운것만 찾는 방법

2단계추천 매커니즘 적용
1. 전체 100개의 종목 중 추천할 40개의 후보를 추림
2. 40개의 점수를 매기고 상위 10개만 추천 (recall@10)

### 2-stage 핵심

1. 1단계에서 선정된 내용만이 2단계를 거쳐 추천될 수 있다
2. 파라미터를 조정하며 내용을 연산량, 계산속도를 줄일 수 있다
3. 후보를 몇개 추릴건지에 따라 품질과 시간이 달라짐. recall과 연산량의 tradeoff (일반적으로는 후보를 줄일수록 recall이 저하)

이번주차는 모델의 성능을 올리기보다는 모델을 최적화하고 tradeoff를 잡는데에 초점을 맞췄다.

# 2. 1~5주차 회고


#BDAI
#데이터분석
#데이터분석학회
#대학생학회
#취업
#취업준비
#대외활동
#대학생활
#수업후기
