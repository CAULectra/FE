### Schnorr 서명

```
KeyGen:  x ←$ Z*q,  y = g^x
Sign(M): α ←$ Z*q,  β = g^α
         c = H(M, β, y)
         s = α + x·c mod q   → σ = (c, s)
Verify:  β' = g^s · y^(−c)
         c ≟ H(M, β', y)
```

### 왜 안전한가

- 서명 위조는 곧 Schnorr 프로토콜의 **건전성을 깨는 것**과 같다 [s:14].
- 랜덤 오라클 모델에서 이산로그가 어려운 한 **위조 불가능(EUF-CMA)** 하다 [s:14].
- **DSA·EdDSA** 계열 서명의 원형이다 [s:15].

> [!example] 기말 단골
> Sign과 Verify를 빈칸으로 내고 $c = H(M, \beta, y)$를 채우게 한다 [s:14].
