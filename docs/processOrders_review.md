# Code Review — processOrders.js (Original Bug Report)

> This is the original bugfix report from the test challenge, preserved
> as a historical artifact. The code has since been fully migrated to
> TypeScript with strict mode and comprehensive tests.

Revisando o código, encontrei três problemas:

## Bug 1 — Off-by-one no loop

A condição `i <= orders.length` fazia o loop rodar uma vez a mais, tentando acessar um índice que não existe no array. Na última iteração, `orders[i]` retorna `undefined`, causando um `TypeError` ao tentar acessar `undefined.quantity`.

**Correção:**

```js
// antes
for (let i = 0; i <= orders.length; i++)

// depois
for (let i = 0; i < orders.length; i++)
```

## Bug 2 — Verificação de desconto com valor falsy

O `if (order.discount)` funciona para os casos comuns, mas deixa passar valores negativos, que seriam aplicados como desconto inválido. Troquei por `if (order.discount > 0)` pra deixar a intenção clara e cobrir esse cenário.

**Correção:**

```js
// antes
if (order.discount)

// depois
if (order.discount > 0)
```

## Bug 3 — Divisão por zero no cálculo da média

Se o array chegar vazio, `processed.length` é `0` e a divisão gera `NaN`. Adicionei um ternário pra retornar `0` nesse caso.

**Correção:**

```js
// antes
average: grandTotal / processed.length;

// depois
average: processed.length > 0 ? grandTotal / processed.length : 0;
```

---

**Status**: All three bugs were fixed and later prevented at compile time
by the TypeScript migration. The Zod validation now rejects invalid inputs
before they reach the processing pipeline.
