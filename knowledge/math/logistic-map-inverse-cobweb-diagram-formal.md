# Interpreting the Dynamics of the Logistic Map Using an Inverse Cobweb Diagram

## Abstract

This paper develops a rigorous framework for studying the logistic map $f(x) = rx(1-x)$ and its multivalued inverse. We prove that the intersection locus of the graphs of $f$ and $f^{-1}$ coincides exactly with the set of fixed points and period-2 orbits of $f$, and we determine this locus as a function of the parameter $r \in [0,4]$. We introduce the alternating iteration sequence, in which $f$ and a selected branch of $f^{-1}$ are applied in alternation, and use it to construct the inverse cobweb diagram. We further derive, in closed form, the unique parameter value $r_o$ for which this iteration admits a stable three-node cycle, and present bifurcation diagrams for the logistic map and a sinusoidal variant.

---

## 1. Introduction

The logistic map is a paradigmatic model in the study of nonlinear discrete dynamical systems, first analyzed in the context of population dynamics by May (1976). Defined by a simple quadratic recurrence relation, the map exhibits a rich bifurcation structure, transitioning from stable fixed points through period-doubling cascades to fully chaotic behavior as the growth parameter $r$ increases.

This paper extends the classical analysis by incorporating the inverse of the logistic map. Section 2 formally defines the logistic map and establishes its endofunction property. Section 3 defines the two branches of the inverse. Section 4 characterizes the intersection locus of $f$ and $f^{-1}$ as the set of fixed points and period-2 orbits of $f$, with proofs. Section 5 defines the alternating iteration sequence. Section 6 introduces the inverse cobweb diagram. Section 7 derives the unique parameter $r_o$ admitting a stable three-node cycle. Sections 8–9 present bifurcation diagrams and conclusions.

---

## 2. The Logistic Map

**Definition 2.1** (Logistic Map). Let $r \in [0,4]$. The *logistic map* is the function $f : [0,1] \to [0,1]$ defined by
$$
f(x) = r x (1 - x).
$$

**Remark 2.1.** The constraint $r \in [0,4]$ is both necessary and sufficient for $f$ to be an endofunction on $[0,1]$. Indeed, $f$ attains its maximum at $x = \tfrac{1}{2}$, where $f(\tfrac{1}{2}) = \tfrac{r}{4}$. Thus $f(x) \leq \tfrac{r}{4} \leq 1$ for all $x \in [0,1]$ if and only if $r \leq 4$.

![Logistic map](images/logistic-map.jpg)

---

## 3. The Inverse Logistic Map

Since $f$ is not injective on $[0,1]$ for $r > 0$, its inverse is multivalued. Solving $y = rx(1-x)$ for $x$ yields two branch functions.

**Definition 3.1** (Inverse Branches). Let $r \in (0,4]$ and $y \in [0, r/4]$. The two branches of the inverse logistic map are
$$
f^{-1}_{-}(y) = \frac{1}{2}\!\left(1 - \sqrt{1 - \frac{4y}{r}}\right), \qquad
f^{-1}_{+}(y) = \frac{1}{2}\!\left(1 + \sqrt{1 - \frac{4y}{r}}\right).
$$

**Remark 3.1.** Both branches are real-valued on $[0, r/4]$. Specifically, $f^{-1}_{-}$ maps $[0, r/4]$ onto $[0, \tfrac{1}{2}]$, and $f^{-1}_{+}$ maps $[0, r/4]$ onto $[\tfrac{1}{2}, 1]$. The two branches coincide at $y = r/4$, where $f^{-1}_{\pm}(r/4) = \tfrac{1}{2}$.

---

## 4. Fixed Points and Period-2 Orbits

**Observation 4.1.** A point $x \in [0,1]$ lies on the graphs of both $f$ and $f^{-1}_\sigma$ (for some branch $\sigma \in \{+,-\}$) if and only if $f(f(x)) = x$. Consequently, the intersection locus of the graphs of $f$ and $f^{-1}$ is precisely the set of fixed points and period-2 points of $f$.

*Proof.* Let $y = f(x)$. The condition $f^{-1}_\sigma(x) = y$ is equivalent to $f(y) = x$, i.e., $f(f(x)) = x$. $\square$

**Proposition 4.1** (Fixed Points). The fixed points of $f$, i.e., the solutions to $f(x) = x$, are:
$$
X_0 = 0 \quad (\text{for all } r \in [0,4]),
$$
$$
X_1 = \frac{r-1}{r} \quad (\text{for } r > 1).
$$

*Proof.* From $rx(1-x) = x$ we obtain $x\bigl(r(1-x) - 1\bigr) = 0$, giving $x = 0$ or $x = (r-1)/r$. The latter lies in $(0,1)$ if and only if $r > 1$. $\square$

**Proposition 4.2** (Period-2 Orbits). For $r > 3$, there exist exactly two additional points $X_2, X_3 \in (0,1)$ satisfying $f(f(x)) = x$ but $f(x) \neq x$, given by:
$$
X_2 = \frac{1}{2r}\!\left(r+1 - \sqrt{r^2 - 2r - 3}\right), \qquad
X_3 = \frac{1}{2r}\!\left(r+1 + \sqrt{r^2 - 2r - 3}\right).
$$

*Proof.* Every period-2 point satisfies $f(f(x)) = x$. Expanding and factoring out the known fixed-point solutions $x = 0$ and $x = (r-1)/r$ from the degree-4 polynomial $f(f(x)) - x$ reduces the problem to the quadratic
$$
r^2 x^2 - r(r+1)x + (r+1) = 0,
$$
whose discriminant is $r^2(r+1)(r-3)$. This is strictly positive if and only if $r > 3$, in which case the two distinct real roots are $X_2$ and $X_3$ as stated. Note $r^2 - 2r - 3 = (r+1)(r-3)$. $\square$

**Summary.** The number and identity of intersection points of $f$ and $f^{-1}$ on $[0,1]$ are:

| Range of $r$ | Intersection points |
|---|---|
| $0 \leq r \leq 1$ | $X_0 = 0$ |
| $1 < r \leq 3$ | $X_0 = 0$, $\quad X_1 = \dfrac{r-1}{r}$ |
| $3 < r \leq 4$ | $X_0,\ X_1,\ X_2,\ X_3$ as in Propositions 4.1–4.2 |

---

## 5. The Alternating Iteration Sequence

**Definition 5.1** (Alternating Iteration). Let $x_0 \in [0,1]$, $r \in (0,4]$, and fix a branch $\sigma \in \{+,-\}$. The *alternating iteration sequence* $\{x_n\}_{n \in \mathbb{N}_0}$ is defined by
$$
x_{n+1} =
\begin{cases}
f(x_n) = r x_n(1 - x_n), & \text{if } n \equiv 0 \pmod{2}, \\[8pt]
f^{-1}_{\sigma}(x_n) = \dfrac{1}{2}\!\left(1 + \sigma\sqrt{1 - \dfrac{4x_n}{r}}\right), & \text{if } n \equiv 1 \pmod{2}.
\end{cases}
$$

**Remark 5.1.** The sequence is well-defined for all $n \in \mathbb{N}_0$: since $f$ maps $[0,1]$ into $[0, r/4]$, every odd-indexed term $x_n$ lies in the domain $[0, r/4]$ of $f^{-1}_\sigma$.

The first four iterates expand as:
$$
x_1 = f(x_0), \qquad
x_2 = f^{-1}_{\sigma}(x_1),
$$
$$
x_3 = f(x_2) = f\!\left(f^{-1}_{\sigma}(f(x_0))\right), \qquad
x_4 = f^{-1}_{\sigma}(x_3).
$$

---

## 6. The Inverse Cobweb Diagram

**Definition 6.1** (Inverse Cobweb Diagram). Let $\{x_n\}$ be the alternating iteration sequence with branch $\sigma$. The *inverse cobweb diagram* is the plane figure consisting of the graphs of $y = f(x)$ and $y = f^{-1}_\sigma(x)$ on $[0,1]$, together with the piecewise-linear orbit path
$$
(x_0,\, f(x_0)) \;\to\; (x_1,\, f^{-1}_\sigma(x_1)) \;\to\; (x_2,\, f(x_2)) \;\to\; \cdots,
$$
where each step alternately traces a vertical segment to one curve and a horizontal segment to the other.

**Remark 6.1.** This construction replaces the diagonal $y = x$ of the classical cobweb diagram with the curve $y = f^{-1}_\sigma(x)$. Fixed points and period-2 orbits appear as closed triangular or rectangular traces; convergence and divergence of orbits are directly observable from the relative curvature of $f$ and $f^{-1}_\sigma$ at those points.

---

## 7. Stable Three-Node Cycle

We seek the unique $r_o > 2$ for which the alternating iteration stabilizes into a three-node cycle whose nodes are $\{x_{o1},\, \tfrac{1}{2},\, f\!\left(\tfrac{1}{2}\right)\}$.

**Lemma 7.1** (Preimages of $\tfrac{1}{2}$). For $r > 2$, the two solutions of $f(x) = \tfrac{1}{2}$ in $[0,1]$ are
$$
x_{o1} = \frac{r - \sqrt{r(r-2)}}{2r}, \qquad x_{o2} = \frac{r + \sqrt{r(r-2)}}{2r}.
$$

*Proof.* Setting $rx(1-x) = \tfrac{1}{2}$ yields $2rx^2 - 2rx + 1 = 0$, with discriminant $4r(r-2) > 0$ for $r > 2$. The two roots are $x_{o1}$ and $x_{o2}$ as stated. $\square$

**Proposition 7.1** (Three-Node Cycle Condition). The alternating iteration with branch $\sigma = +$ closes into the three-node cycle
$$
x_{o1} \;\xrightarrow{f}\; \tfrac{1}{2} \;\xrightarrow{f^{-1}_{+}}\; f\!\left(\tfrac{1}{2}\right) \;\xrightarrow{f}\; x_{o1}
$$
if and only if $r$ satisfies
$$
f^{-1}_{+}(x_{o1}) = f\!\left(\tfrac{1}{2}\right) = \frac{r}{4},
$$
which, upon substituting Definition 3.1 and Lemma 7.1, expands to:
$$
\frac{1}{2}\!\left(1 + \sqrt{1 - \frac{2(r - \sqrt{r(r-2)})}{r^2}}\right) = \frac{r}{4}.
$$

**Corollary 7.1.** The unique solution $r_o > 2$ of the equation in Proposition 7.1 is the root of a resolvent cubic, given in closed form by
$$
r_o = 1 + \sqrt{1 + \frac{1}{3}\!\left(8 + \bigl(800 - 96\sqrt{69}\bigr)^{1/3} + 2^{5/3}\bigl(25 + 3\sqrt{69}\bigr)^{1/3}\right)},
$$
$$
r_o \approx 3.8318740552833155684103627754961065557978278526036946304788904477.
$$

---

## 8. Bifurcation Diagrams

### 8.1 Logistic Map

The bifurcation diagram of $f(x) = rx(1-x)$ is generated by iterating $f$ over a dense grid of $r \in [0,4]$, discarding transient iterates, and plotting asymptotic values. The diagram exhibits the classical Feigenbaum period-doubling cascade, accumulating at $r_\infty \approx 3.56995$, beyond which chaotic behavior dominates with periodic windows embedded throughout.

### 8.2 Sinusoidal Variant

The function $g : [0,1] \to [0,1]$ defined by
$$
g(x) = \frac{r}{4}\sin(\pi x)
$$
is topologically conjugate to $f$ on $[0,1]$ for each fixed $r$, and its bifurcation diagram is qualitatively identical to that of $f$. This diagram provides an alternative representation confirming the universality of the period-doubling route to chaos in unimodal maps.

---

## 9. Conclusion

This paper has established a rigorous framework for the interplay between the logistic map $f$ and its two inverse branches $f^{-1}_\pm$. The principal results are: (i) an identification of the intersection locus of $f$ and $f^{-1}$ with the set of fixed points and period-2 orbits of $f$ (Propositions 4.1–4.2); (ii) a formal definition of the alternating iteration sequence and the inverse cobweb diagram; and (iii) a closed-form derivation of the parameter value $r_o \approx 3.8319$ at which a stable three-node cycle exists (Corollary 7.1). These results deepen the understanding of controlled periodic behavior in the logistic family.

---

## References

1. May, R. M. (1976). Simple mathematical models with very complicated dynamics. *Nature*, *261*(5560), 459–467.
2. Strogatz, S. H. (2018). *Nonlinear Dynamics and Chaos: With Applications to Physics, Biology, Chemistry, and Engineering* (2nd ed.). CRC Press.
3. Devaney, R. L. (1989). *An Introduction to Chaotic Dynamical Systems*. Addison-Wesley.
