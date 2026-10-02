---
layout: post
title: 짜잔 사실 BERT는 diffusion model이었음(와전)
subtitle: BERT is just a Single Text Diffusion Step
tags: [article]
comments: true
mathjax: false
author: Geunyeong Cho
published : true
---

원문 : [https://nathan.rs/posts/roberta-diffusion](https://nathan.rs/posts/roberta-diffusion)

### 1. BERT=1스텝 확산 모델으로 보는 접근방식 제안

RoBERTa 같은 MLM(인코더 기반 언어모델)은 단일 마스킹-복원 스텝만 수행하는 “1-step discrete diffusion”으로 볼 수 있고
여러 스텝으로 확장하면 완전한 생성 모델이 된다.<br/><br/>

### 2. 비자동회귀적 생성 경로

GPT류의 “순차적 예측” 없이도 점진적 복원(iterative denoising) 만을 통해 문장을 생성할 수 있음을 보였다 (원문 참조)
효율적 텍스트 생성의 대안 구조가 될 가능성을 제시함<br/><br/>

### 3. 학습 목표의 재통합

BERT의 복원 기반 목적 + GPT의 확률적 생성 목적 => 연속 스케줄 형태
가 가능하지 않을까? > 향후 unified objective 설계의 기초<br/><br/>

### 4. 모델 효율성 / 병렬화

확산식 텍스트 생성은 토큰을 병렬 복원할 수 있으므로 긴 문장에서도 시간 복잡도가 낮음
(속도-품질 트레이드오프를 조정 가능)<br/><br/>

### 5. 생성 다양성 확장

마스킹 비율 스케줄에 따라 결과 다양성을 조절할 수 있기 때문에 동일 프롬프트에서의 다중 샘플링이 자연스럽게 구현댐<br/><br/>

### 결론

기존 통념 “BERT=비생성형 모델”이라는 전제를 무너뜨림
인코더 구조만으로도 확산적 생성이 가능하다는 전환점 제시<br/><br/>

### 추가 관련자료

[https://arxiv.org/abs/2107.03006](https://arxiv.org/abs/2107.03006)<br/>
[https://arxiv.org/abs/1904.09324](https://arxiv.org/abs/1904.09324)<br/>
[https://arxiv.org/pdf/1902.04094](https://arxiv.org/abs/1904.09324)<br/>
