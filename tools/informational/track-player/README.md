### Track-Player: Formal Mathematical Specification  
A visual tool for interacting with temporal structures ("tracks") through playback control (play, pause, rewind, etc.) and visualization. The system is defined hierarchically as follows:

---

#### **1. Time Unit (τ)**  
Let \( \tau \in \mathbb{T} \) denote the **time unit**, an indivisible temporal interval of fixed length.  
- **Properties**:  
  - \( \tau > 0 \): Duration of one time unit (e.g., \( \tau = 0.5\,s \) for a 120 BPM musical beat).  
  - Acts as the atomic unit for all temporal measurements in the track.  

---

#### **2. Timebox (T)**  
A timebox \( T \) is a contiguous interval within a track, defined by:  
\[
T = \left( t_{\text{start}},\ n \right)
\]  
where:  
- \( t_{\text{start}} \in \mathbb{D} \): Start time of \( T \), relative to the track's origin.  
  - Default: \( t_{\text{start}} = 0 \).  
- \( n \in \mathbb{N} \): Number of time units in \( T \), defining its duration as \( n \cdot \tau \).  
  - Default: \( n = 8 \) (e.g., 2 musical measures of 4/4).  

---

#### **3. Section (S)**  
A section \( S \) is an ordered sequence of timeboxes:  
\[
S = \left\langle T_1, T_2, \ldots, T_k \right\rangle
\]  
with properties:  
- \( \text{index}(S) \in \mathbb{N} \): Position of \( S \) in the track.  
- \( \text{description}(S) \in \mathbb{S} \): Brief textual summary of \( S \).  
- \( \text{image}(S) \in \mathbb{U} \): URL of a visual asset for \( S \).  

---

#### **4. Track (Θ)**  
A track \( \Theta \) is a tuple:  
\[
\Theta = \left( \text{id},\ \text{desc},\ \tau,\ \delta,\ \left\langle S_1, S_2, \ldots, S_m \right\rangle \right)
\]  
where:  
- \( \text{id} \in \mathbb{S} \): Unique identifier for \( \Theta \).  
  - Default: \( \text{id} = \text{"untitled-track"} \).  
- \( \text{desc} \in \mathbb{S} \): Single-sentence description of \( \Theta \).  
  - Default: \( \text{desc} = \text{"undescribed"} \).  
- \( \tau \in \mathbb{T} \): Duration of one time unit (see §1).  
  - Default: \( \tau = 0.5\,s \).  
- \( \delta \in \mathbb{T} \): Padding duration prepended to the track.  
  - Default: \( \delta = 0 \).  
  - Example: \( \delta = 1\,day \).  
- \( \left\langle S_1, S_2, \ldots, S_m \right\rangle \): Ordered sequence of sections (see §3).  
  - Default: Empty sequence \( \left\langle \right\rangle \).  

---

### **Formal Relationships**  
1. **Total Duration of a Track**:  
   \[
   \text{Duration}(\Theta) = \delta + \sum_{S \in \Theta} \sum_{T \in S} n_T \cdot \tau
   \]  
   where \( n_T \) is the number of time units in timebox \( T \).  

2. **Structure Hierarchy**:  
   \[
   \Theta \to \left\langle S_1, S_2, \ldots, S_m \right\rangle \quad \text{where} \quad S_i \to \left\langle T_{i1}, T_{i2}, \ldots, T_{ik} \right\rangle
   \]  

3. **Time Unit Constraints**:  
   - All temporal operations (play, pause, etc.) align with \( \tau \)-granularity.  
   - Timeboxes are contiguous and non-overlapping:  
     \[
     \forall S \in \Theta,\ \forall T_j, T_{j+1} \in S: \quad t_{\text{start}}(T_{j+1}) = t_{\text{start}}(T_j) + n_j \cdot \tau
     \]  

---

### **Examples**  
- **Time Unit**:  
  \( \tau = 1\,\text{minute} \implies \text{A timebox with } n=5 \text{ has duration } 5\,\text{minutes}. \)  
- **Track Padding**:  
  \( \delta = 7\,\text{days} \implies \text{The track begins with a 1-week lead-in period}. \)  

This formalism enables precise temporal manipulation and visualization, with \( \tau \) as the foundational unit of measure.