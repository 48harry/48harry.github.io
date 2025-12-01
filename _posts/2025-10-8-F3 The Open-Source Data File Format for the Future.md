---
layout: post
title: F3, The Open-Source Data File Format for the Future
subtitle:
tags: [article]
comments: false
mathjax: true
author: Geunyeong Cho
published : true
---

최근 흥미로운 논문이 게재되어서 Gemini한테 물어본 내용을 바탕으로 정리해봄
[https://db.cs.cmu.edu/papers/2025/zeng-sigmod2025.pdf](https://db.cs.cmu.edu/papers/2025/zeng-sigmod2025.pdf)

### 배경

현대의 하드웨어와 워크로드 환경에 맞지 않는 기존 오픈 소스 컬럼형 파일 형식(예:Parquet, ORC)의 한계와 비효율성을 극복하기 위해 설계된 F3 (Future-proof File Format) 프로젝트를 소개합니다. F3의 핵심 설계 원칙은 상호 운용성, 확장성, 효율성입니다.

보통 데이터 저장방식은 row based 혹은 column based의 어쟀든 2차원 평면상의 좌표를 가지고 포인터로 접근하는 형식인건데, F3은 자체적인 플러그인 디코더를 가지고 데이터 접근을 가능하게 한다는게 이론이다.

정말 비약적으로 쉽게 설명하자면, 지금까지는 도서관에서 책을 찾아야했다면 일단 장르별로 나뉘어진곳에 가서, 알파벳순으로 정렬된 책들 사이에서 몇번째 책장 어디에 있는지 찾아야했다. 하지만 F3의 도입은 (만약 이론대로 가능해진다면) 개인이 서재검색 프로그램에 접근할 수 있게되는것이고, 심지어 e북으로 책을 읽을 수있게되는 느낌인것이다.

### 문제 정의

**구형 형식의 한계**: Parquet이나 ORC와 같은 주요 형식은 10여 년 전에 설계되어, 스토리지 및 네트워크 성능은 크게 향상되었으나 CPU 성능은 그에 미치지 못하는 현재의 환경(특히 클라우드 스토리지)에 부적합합니다. 또한, 수천 개의 컬럼을 가진 와이드 테이블이나 고차원 벡터 임베딩을 저장하는 최신 ML 워크로드의 사용 패턴(무작위 접근, 업데이트 등)에 적합하지 않습니다.

**상호 운용성/확장성 문제**: 기존 형식은 새로운 인코딩이나 압축 기술의 추가가 쉽지 않고 (확장성) , 새로운 기능이 추가되어도 다양한 언어와 플랫폼에 걸친 라이브러리 버전 불일치로 인해 모든 시스템이 최신 기능을 지원하지 못하여 결국 가장 기본적인 기능만 사용하게 됩니다 (상호 운용성).

​아무래도 대AI시대에 현재의 데이터저장방식으로는 기술적인 한계를 초래하게 된다. 특히 parquet의 호환성에 대해서는 많은 엔지니어들이 고통받고있는것이 주지의 사실이며 데이터 다형성 측면에서 현재의 row,column based database로는 표현력이 떨어지는 경우가 많다.

뿐만 아니라 단순히 병목현상 부분만 봐도 항상 CPU가 퍼포먼스를 따라가지 못하는 경우가 허다하기 때문에 돌파구가 필요했던것

### 목적

F3는 이러한 문제를 해결하고 데이터 처리 및 컴퓨팅 환경이 변화할 때마다 새로운 형식을 만들 필요를 없애기 위해, 데이터 구조와 일반적인 API를 제공하여 새로운 인코딩 방식을 쉽게 추가하고 , 라이브러리 버전에 관계없이 상호 운용성을 보장하는 것을 목표로 합니다.

### 차별점

A. WebAssembly (Wasm) 기반 디코더 임베딩 (상호 운용성 및 확장성)

1. 디코더 내장: 각 F3 파일에는 데이터와 메타데이터뿐만 아니라, 데이터를 디코딩할 수 있는 WebAssembly (Wasm) 바이너리가 포함됩니다.

2. Wasm의 장점: Wasm은 이식 가능하고(portable), 메모리 안전한 샌드박스 실행 환경을 제공하며, 네이티브 코드에 가까운 속도를 내면서도 바이너리 크기가 작아 (킬로바이트 수준) 파일 오버헤드가 적습니다.
​
3. 상호 운용성 보장: 파일에 디코더 코드가 포함되어 있으므로, 어떤 플랫폼에서도 네이티브 디코더가 없거나 라이브러리가 오래된 버전이더라도 해당 파일의 데이터를 읽을 수 있습니다.

4. 확장성 촉진: 새로운 인코딩 방법은 F3 코어 라이브러리와 별개로 설치 및 업그레이드할 수 있는 "플러그인"으로 취급되며, 개발자들은 라이브러리 전체를 업그레이드할 필요 없이 Wasm 코드를 파일에 포함시켜 새로운 인코딩을 배포할 수 있습니다.

![F3 format](C:\48harry.github.io\assets\img\F3_format.png)

이중 핵심은 metadata부의 Wasm 그리고 데이터를 쪼개고 쪼개고 쪼갠단위인 I/O유닛의 특성값인 EncUnits
어쨌든 구조적인 관점에서는 데이터 내용물과 함께 시스템(API)이 경량화되어 내장되어 있다는게 핵심 아이디어. 
API가 어떻게 이식하는지에 대한 기술적인 부분은 응용단계이니 I/Ounit에 대해 살펴보는게 중요할듯.


B. 효율성을 위한 파일 레이아웃 재설계

1. I/O 단위(IOUnit) 분리: F3는 논리적 데이터 분할 단위인 Row Group의 개념을 물리적 I/O 단위인 IOUnit에서 분리합니다.

기존 Parquet은 Row Group이 I/O 단위와 묶여 있어, 전체 Row Group이 메모리에 버퍼링될 때까지 쓰기를 지연해야 했고, 이는 OOM(Out of Memory) 오류와 비효율적인 I/O 크기를 초래했습니다. F3에서는 IOUnit(기본값 8MB)이 채워질 때마다 디스크에 플러시할 수 있어 쓰기 메모리 사용량이 일정하며, 클라우드 객체 스토리지(예: S3)에 최적화된 일관된 청크 크기를 제공합니다

![Dynamic Flushing](C:\48harry.github.io\assets\img\Dynamic_Flushing.png)


2. 동적 플러싱이 가능하다는것이, 그것도 특히 메타데이터로 포함된 API가 자체적으로 인덱싱을 하는데 드는 입출력 호출이 그렇게 가능하다면, 분명히 획기적인 변경임
I/OUnit 분리는 Row Group 전체를 기다리지 않고 일정 크기가 찰 때마다 Flush를 분할적으로 수행해 메모리 사용량을 낮추는 것이 핵심임
이 과정에서 발생하는 병렬 연산 처리는 I/OUnit, EncUnit 단위의 병렬성 이점을 제공하긴 하지만 핵심은 메모리 효율적인 쓰기와 I/O 단위의 일관성 확보라고 볼수있음

3. 유연한 딕셔너리 범위(Flexible Dictionary Scope): Parquet과 ORC는 딕셔너리 인코딩의 범위를 Row Group에 고정하는 반면 , F3는 딕셔너리 범위를 Row Group에서 분리합니다. 이를 통해 각 컬럼의 특성(예: 값의 길이, 고유 값 수)에 따라 로컬 딕셔너리, 공유 딕셔너리, 또는 딕셔너리 없음 중에서 가장 효율적인 압축률을 달성하는 범위를 선택할 수 있습니다.

4. 메타데이터의 제로-카피 디시리얼라이제이션: F3는 각 컬럼의 메타데이터를 FlatBuffer로 직렬화하여, 쿼리가 특정 컬럼의 메타데이터만 필요할 때 전체 메타데이터를 역직렬화할 필요 없이 선택적으로 읽을 수 있습니다. 이는 와이드 테이블에서 메타데이터 파싱 오버헤드를 크게 줄여줍니다.


C. 중첩 데이터 처리 및 API

1. L&P 모델 채택: F3는 Parquet의 Dremel 모델 대신 ORC/Arrow의 Length and Presence (L&P) 모델을 중첩 데이터 처리의 기본 메커니즘으로 채택했습니다. 이는 구현이 더 쉽고, 현대 쿼리 엔진에서 널리 사용되는 인메모리 형식인 Apache Arrow 와의 일관성을 유지하기 위함입니다.

​2. 디코딩 API: F3는 EncUnit(Encoding Unit, 인코딩 및 디코딩의 최소 단위)에 접근하기 위한 일반적인 API를 정의하며, 출력 형식으로 Apache Arrow를 사용합니다.

API는 기본적으로 apache arrow 방식을 기저로하나 현재 단계로서는 인-디코딩 및 중첩처리 부분정도에만 적용되며 이또한 후속연구로 대체될 가능성이 있다.

### 기대효과

1. 메타데이터 오버헤드: 와이드 테이블에서 F3는 다른 FlatBuffer 기반 형식보다 메타데이터 처리 시간이 빠르며, Parquet보다 훨씬 빠릅니다 (10배 이상).
column이 늘어날수록 소요시간이 획기적으로 단축되는것을 확인할 수 있음

![Metadata Overhead Comparison](C:\48harry.github.io\assets\img\Metadata_Overhead_Comparison.png)

2. 압축 및 처리량: F3는 기존 형식과 비교하여 유사하거나 우수한 파일 읽기 처리량(File-reading Throughput)을 달성하며, 약간의 압축률 저하만 보입니다. 이는 벡터화된 디코딩을 활용하기 때문입니다.

​컬럼형 스토리지 방식의 장점(데이터 동질성, 벡터화 디코딩)을 F3가 새로운 인코딩과 레이아웃을 통해 극대화함
(벡터화 디코딩은 SIMD(Single Instruction, Multiple Data) 명령어를 사용하여 여러 데이터를 병렬 처리하는 기법)

3. 무작위 접근: I/O Unit 분리 설계 덕분에 F3는 Lance 다음으로 가장 빠른 무작위 접근 성능을 보여줍니다.​

4. Wasm 오버헤드: Wasm 기반 디코딩은 네이티브 코드에 비해 10~35% (정수 및 부동 소수점)에서 최대 46% (문자열)의 속도 저하를 보이지만, 상호 운용성과 확장성의 이점을 고려할 때 허용 가능한 범위입니다. Wasm 바이너리 크기는 작고 (확장 인코딩은 150KB 내외, 내장 인코딩은 Zstd 압축 후 약 1MB) , 파일 전체 크기에 미치는 오버헤드는 무시할 수 있는 수준입니다.

+

5. Wasm 확장성: Wasm을 사용하여 도메인별 맞춤형 인코딩을 파일에 임베딩함으로써 파일 크기를 크게 줄이고(50% 이상) , 내장 인코딩과 유사하거나 더 빠른 파일 스캔 시간을 달성할 수 있음을 입증했습니다

결국 API의 경량화가 이끌어낸 두가지의 효과라고 볼 수 있다. Wasm을 '내부'에 내장하여 자급자족적으로 기능하게금하여 해석가능성을 외부(라이브러리 버전)에 의탁하는 문제를 해결하는것

따지고보면 전체 용량 감소는 Wasm 덕분이 아니라 '레이아웃과 최신 압축 및 인코딩' 덕이고, Wasm은 파일 오버헤드를 줄이는데에 의의가 있다고 보여짐

### 마치면서

이 논문 칭화대에서 나왔다
요즘들어 이런 CS분야에서 관련 논문을 중국에서 많이 내고있는데
인제 중국이 거의 다 따라잡은것같다

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
