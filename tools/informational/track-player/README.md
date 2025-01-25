### Track-Player: Formal Mathematical Model  
A visual tool for interacting with temporal structures ("tracks") through playback control (play, pause, rewind, etc.) and visualization. The system is defined hierarchically as follows:  

---  

#### **1. Time Unit ($\tau$)**  
Let $\tau \in \mathbb{T}$ denote the **time unit**, an indivisible temporal interval of fixed length.  
- **Properties**:  
  - $\tau > 0$: Duration of one time unit (e.g., $\tau = 0.5\,s$ for a 120 BPM musical beat).  
  - Acts as the atomic unit for all temporal measurements in the track.  

---  

#### **2. Timebox ($T$)**  
A timebox $T$ represents a contiguous interval within a track, defined by:  
$$  
T = (t_{\text{start}}, \text{desc})
$$  
**where**:  
- $t_{\text{start}} \in \mathbb{D}$: Start time of $T$, relative to the track's origin.  
  - *Default*: $t_{\text{start}} = 0$.
- $\text{desc} \in \mathbb{S}$: Description of the timebox content.
  - *Default*: $\text{desc} = \text{""}$ (empty string).

---  

#### **3. Section ($S$)**  
A section $S$ is an ordered sequence of timeboxes:  
$$  
S = \left\langle T_1, T_2, \ldots, T_k \right\rangle  
$$  
**with properties**:  
- $\text{index}(S) \in \mathbb{N}$: Position of $S$ in the track.  
- $\text{desc}(S) \in \mathbb{S}$: Brief textual summary of $S$.  
- $\text{image}(S) \in \mathbb{U}$: URL of a visual asset for $S$.  

---  

#### **4. Track ($\Theta$)**  
A track $\Theta$ is a tuple:  
$$  
\Theta = \left( \text{id},\ \text{desc},\ \tau,\ \delta,\ n,\ \left\langle S_1, S_2, \ldots, S_m \right\rangle \right)  
$$  
**where**:  
- $\text{id} \in \mathbb{S}$: Unique identifier for $\Theta$.  
  - *Default*: $\text{id} = \text{"untitled-track"}$.  
- $\text{desc} \in \mathbb{S}$: Single-sentence description of $\Theta$.  
  - *Default*: $\text{desc} = \text{"undescribed"}$.  
- $\tau \in \mathbb{T}$: Duration of one time unit (see §1).  
  - *Default*: $\tau = 0.5\,s$.  
- $\delta \in \mathbb{T}$: Padding duration prepended to the track.  
  - *Default*: $\delta = 5$.  
  - *Example*: $\delta = 1\,\text{day}$.  
- $n \in \mathbb{N}$: Number of time units per timebox
  - *Default*: $n = 8$ (e.g., 2 musical measures of 4/4).  
- $\left\langle S_1, S_2, \ldots, S_m \right\rangle$: Ordered sequence of sections (see §3).  
  - *Default*: Empty sequence $\left\langle \right\rangle$.  

---  

#### **5. Track State ($\Psi$)**  
A track state $\Psi$ represents a specific temporal position within a track, defined as:
$$
\Psi = \left( i,\ j,\ k \right)
$$
**where**:
- $i \in \mathbb{N}$: Index of the current section within $\Theta$'s sequence.
  - $0 \leq i < |\Theta.\text{sections}|$
- $j \in \mathbb{N}$: Index of the current timebox within section $S_i$.
  - $0 \leq j < |S_i.\text{timeboxes}|$
- $k \in \mathbb{N}$: Index of the current time unit within timebox $T_{ij}$.
  - $0 \leq k < T_{ij}.n$

**Properties**:
1. **Initial State**:
   $$
   \Psi_0 = (0,\ 0,\ 0)
   $$

2. **State Transitions**:
   - Forward progression:
     $$
     \Psi_{t+1} = \begin{cases}
     (i,\ j,\ k+1) & \text{if } k + 1 < T_{ij}.n \\
     (i,\ j+1,\ 0) & \text{if } k + 1 = T_{ij}.n \text{ and } j + 1 < |S_i.\text{timeboxes}| \\
     (i+1,\ 0,\ 0) & \text{if } k + 1 = T_{ij}.n \text{ and } j + 1 = |S_i.\text{timeboxes}| \\
     \text{undefined} & \text{otherwise}
     \end{cases}
     $$

3. **Absolute Time**:
   The absolute time position for any state can be calculated as:
   $$
   t(\Psi) = \delta + \sum_{x=0}^{i-1} \text{Duration}(S_x) + \sum_{y=0}^{j-1} \text{Duration}(T_{iy}) + k \cdot \tau
   $$

4. **State Constraints**:
   $$
   \forall \Psi = (i,\ j,\ k): \begin{cases}
   0 \leq i < |\Theta.\text{sections}| \\
   0 \leq j < |S_i.\text{timeboxes}| \\
   0 \leq k < T_{ij}.n
   \end{cases}
   $$

5. **Key Operations**:
   
   a. **State Advancement** ($\text{advance}: \Psi \to \Psi$):
      $$
      \text{advance}(\Psi) = \begin{cases}
      (i,\ j,\ k+1) & \text{if } k + 1 < T_{ij}.n \\
      (i,\ j+1,\ 0) & \text{if } k + 1 = T_{ij}.n \land j + 1 < |S_i.\text{timeboxes}| \\
      (i+1,\ 0,\ 0) & \text{if } k + 1 = T_{ij}.n \land j + 1 = |S_i.\text{timeboxes}| \land i + 1 < |\Theta.\text{sections}| \\
      \text{undefined} & \text{otherwise}
      \end{cases}
      $$

   b. **State Rewind** ($\text{rewind}: \Psi \to \Psi$):
      $$
      \text{rewind}(\Psi) = \begin{cases}
      (i,\ j,\ k-1) & \text{if } k > 0 \\
      (i,\ j-1,\ T_{i,j-1}.n-1) & \text{if } k = 0 \land j > 0 \\
      (i-1,\ |S_{i-1}.\text{timeboxes}|-1,\ T_{i-1,\text{last}}.n-1) & \text{if } k = 0 \land j = 0 \land i > 0 \\
      \text{undefined} & \text{otherwise}
      \end{cases}
      $$

   c. **Jump to Time** ($\text{seek}: \mathbb{R} \to \Psi$):
      $$
      \text{seek}(t) = \begin{cases}
      (i,\ j,\ k) & \text{where } t(\Psi) \leq t < t(\text{advance}(\Psi)) \\
      \text{undefined} & \text{if } t < 0 \text{ or } t > \text{Duration}(\Theta)
      \end{cases}
      $$

   d. **Section Jump** ($\text{jumpToSection}: \mathbb{N} \to \Psi$):
      $$
      \text{jumpToSection}(i) = \begin{cases}
      (i,\ 0,\ 0) & \text{if } 0 \leq i < |\Theta.\text{sections}| \\
      \text{undefined} & \text{otherwise}
      \end{cases}
      $$

   e. **State Validation** ($\text{isValid}: \Psi \to \{\text{true}, \text{false}\}$):
      $$
      \text{isValid}(\Psi) = \begin{cases}
      \text{true} & \text{if } 0 \leq i < |\Theta.\text{sections}| \land \\
      & 0 \leq j < |S_i.\text{timeboxes}| \land \\
      & 0 \leq k < T_{ij}.n \\
      \text{false} & \text{otherwise}
      \end{cases}
      $$

   f. **State Comparison** ($\text{compare}: \Psi \times \Psi \to \{-1, 0, 1\}$):
      $$
      \text{compare}(\Psi_1, \Psi_2) = \begin{cases}
      -1 & \text{if } t(\Psi_1) < t(\Psi_2) \\
      0 & \text{if } t(\Psi_1) = t(\Psi_2) \\
      1 & \text{if } t(\Psi_1) > t(\Psi_2)
      \end{cases}
      $$

These operations form a complete algebra for manipulating track state, enabling:
- Forward and backward navigation through the track
- Direct seeking to specific times
- Section-based navigation
- State validation and comparison
- Precise temporal control aligned with the track's time unit ($\tau$)

---  

### **Formal Relationships**  
1. **Total Duration of a Track**:  
   $$  
   \text{Duration}(\Theta) = \delta + \sum_{S \in \Theta} \sum_{T \in S} n_T \cdot \tau  
   $$  
   where $n_T$ is the number of time units in timebox $T$.  

2. **Structure Hierarchy**:  
   $$  
   \Theta \to \left\langle S_1, S_2, \ldots, S_m \right\rangle \quad \text{where} \quad S_i \to \left\langle T_{i1}, T_{i2}, \ldots, T_{ik} \right\rangle  
   $$  

3. **Time Unit Constraints**:  
   - All temporal operations (play, pause, etc.) align with $\tau$-granularity.  
   - Timeboxes are contiguous and non-overlapping:  
   $$  
   \forall S \in \Theta,\ \forall T_j, T_{j+1} \in S: \quad t_{\text{start}}(T_{j+1}) = t_{\text{start}}(T_j) + n_j \cdot \tau  
   $$  

---  

### **Examples**  
- **Time Unit**:  
  $\tau = 1\,\text{minute} \implies \text{A timebox with } n=5 \text{ has duration } 5\,\text{minutes}.$  
- **Track Padding**:  
  $\delta = 7\,\text{days} \implies \text{The track begins with a 1-week lead-in period}.$  

This formalism enables precise temporal manipulation and visualization, with $\tau$ as the foundational unit of measure.  

---  

#### **6. Track Player ($\Pi$)**
A track player $\Pi$ is a stateful system that manages playback of a track, defined as:
$$
\Pi = \left(\Theta,\ \Psi,\ \rho,\ \nu \right)
$$
**where**:
- $\Theta$: The track being played (see §4)
- $\Psi$: Current track state (see §5)
- $\rho \in \{\text{PLAYING}, \text{PAUSED}, \text{STOPPED}\}$: Playback mode
- $\nu \in \mathbb{R}$: Playback speed multiplier
  - *Default*: $\nu = 1.0$
  - *Example*: $\nu = 2.0$ for double speed

**Basic Operators**:

a. **Play** ($\text{play}: \Pi \to \Pi$):
   $$
   \text{play}(\Pi) = \begin{cases}
   (\Theta,\ \Psi,\ \text{PLAYING},\ \nu) & \text{if } \text{isValid}(\Psi) \\
   (\Theta,\ \Psi_0,\ \text{PLAYING},\ \nu) & \text{if } \Psi \text{ undefined}
   \end{cases}
   $$

b. **Pause** ($\text{pause}: \Pi \to \Pi$):
   $$
   \text{pause}(\Pi) = (\Theta,\ \Psi,\ \text{PAUSED},\ \nu)
   $$

c. **Stop** ($\text{stop}: \Pi \to \Pi$):
   $$
   \text{stop}(\Pi) = (\Theta,\ \Psi_0,\ \text{STOPPED},\ \nu)
   $$

d. **Set Speed** ($\text{setSpeed}: \Pi \times \mathbb{R} \to \Pi$):
   $$
   \text{setSpeed}(\Pi,\ \nu') = \begin{cases}
   (\Theta,\ \Psi,\ \rho,\ \nu') & \text{if } \nu' > 0 \\
   \Pi & \text{otherwise}
   \end{cases}
   $$

e. **Update State** ($\text{tick}: \Pi \times \Delta t \to \Pi$):
   $$
   \text{tick}(\Pi,\ \Delta t) = \begin{cases}
   (\Theta,\ \text{advance}(\Psi),\ \rho,\ \nu) & \text{if } \rho = \text{PLAYING} \land \Delta t \geq \tau/\nu \\
   \Pi & \text{otherwise}
   \end{cases}
   $$

f. **Get Current Time** ($\text{currentTime}: \Pi \to \mathbb{R}$):
   $$
   \text{currentTime}(\Pi) = t(\Psi)
   $$

g. **Get Remaining Time** ($\text{remainingTime}: \Pi \to \mathbb{R}$):
   $$
   \text{remainingTime}(\Pi) = \text{Duration}(\Theta) - t(\Psi)
   $$

**State Transitions**:
$$
\begin{matrix}
\text{STOPPED} & \xrightarrow{\text{play}} & \text{PLAYING} & \xrightarrow{\text{pause}} & \text{PAUSED} \\
& & \downarrow\text{stop} & & \downarrow\text{stop} \\
& & \text{STOPPED} & \xleftarrow{\text{stop}} & \text{PAUSED} \\
& & & \xrightarrow{\text{play}} &
\end{matrix}
$$

**Properties**:
1. **Time Quantization**:
   - All state updates are quantized to track's time unit ($\tau$)
   - $\text{tick}$ advances state only when accumulated time ≥ $\tau/\nu$

2. **State Invariants**:
   $$
   \begin{aligned}
   & \forall \Pi: \text{isValid}(\Pi.\Psi) \\
   & \forall \Pi: \Pi.\nu > 0 \\
   & \forall \Pi: \Pi.\rho \in \{\text{PLAYING}, \text{PAUSED}, \text{STOPPED}\}
   \end{aligned}
   $$

3. **Playback Constraints**:
   - State advances only in PLAYING mode
   - STOPPED state always implies $\Psi = \Psi_0$
   - Speed changes preserve current position

This formalism provides a complete specification for implementing track playback with precise temporal control and state management.

---

#### **7. Screen ($\Sigma$)**
A screen $\Sigma$ is a visual interface that maps internal state to user-visible elements:
$$
\Sigma = \left(R,\ \mathcal{C},\ \mathcal{I},\ \mathcal{H} \right)
$$
**where**:
- $R = (w,\ h) \in \mathbb{N}^2$: Screen resolution/dimensions
- $\mathcal{C}$: Set of visual components
- $\mathcal{I}$: Set of input handlers
- $\mathcal{H}$: Component hierarchy

**Key Aspects**:

1. **Visual Component** ($c \in \mathcal{C}$):
   $$
   c = \left(id,\ \text{type},\ \text{props},\ \text{state},\ \phi \right)
   $$
   where:
   - $id$: Unique identifier
   - $\text{type}$: Component type (e.g., button, text)
   - $\text{props}$: Static properties
   - $\text{state}$: Dynamic properties
   - $\phi: \text{state} \to \text{visual}$: Render function

2. **Input Handler** ($h \in \mathcal{I}$):
   $$
   h: \text{Event} \times \Sigma \to \Sigma
   $$

3. **Component Hierarchy** ($\mathcal{H}$):
   $$
   \mathcal{H} = \{(p,\ c) \in \mathcal{C} \times \mathcal{C}\ |\ p \text{ is parent of } c\}
   $$

---

#### **8. Track Player Screen ($\Sigma_\Pi$)**
A specialized screen for track player interaction:
$$
\Sigma_\Pi = \left(R,\ \mathcal{C}_\Pi,\ \mathcal{I}_\Pi,\ \mathcal{H}_\Pi,\ \Pi \right)
$$

**Core Components** ($\mathcal{C}_\Pi$):

1. **Timeline** ($\tau\text{-line}$):
   $$
   \tau\text{-line} = \left(\text{pos},\ \text{scale},\ \mathcal{M} \right)
   $$
   where:
   - $\text{pos} \in [0, 1]$: Current position
   - $\text{scale} > 0$: Zoom level
   - $\mathcal{M}$: Set of timeline markers

2. **Control Panel** ($\kappa$):
   $$
   \kappa = \left(\text{mode},\ \mathcal{B},\ \nu\text{-control} \right)
   $$
   where:
   - $\text{mode}$: Current playback mode
   - $\mathcal{B}$: Set of control buttons
   - $\nu\text{-control}$: Speed control

3. **Section View** ($\sigma$):
   $$
   \sigma = \left(S_\text{current},\ \mathcal{V},\ \text{layout} \right)
   $$
   where:
   - $S_\text{current}$: Currently visible section
   - $\mathcal{V}$: Visual elements
   - $\text{layout}$: Layout function

**Input Handlers** ($\mathcal{I}_\Pi$):

1. **Playback Control**:
   $$
   h_\text{play}: \text{Click} \times \Pi \to \Pi
   $$

2. **Timeline Navigation**:
   $$
   h_\text{seek}: \text{Click} \times \tau\text{-line} \times \Pi \to \Pi
   $$

3. **Section Selection**:
   $$
   h_\text{section}: \text{Click} \times \sigma \times \Pi \to \Pi
   $$

**State Mapping**:
$$
\phi_\Pi: \Pi \to \Sigma_\Pi
$$

**Properties**:

1. **Visual Consistency**:
   $$
   \forall \pi_1, \pi_2 \in \Pi: \pi_1 = \pi_2 \implies \phi_\Pi(\pi_1) = \phi_\Pi(\pi_2)
   $$

2. **Temporal Alignment**:
   $$
   \forall t \in \mathbb{R}: \tau\text{-line}.\text{pos} = \frac{t}{\text{Duration}(\Theta)}
   $$

3. **Interactive Feedback**:
   - All state changes reflect immediately in UI
   - Visual feedback for all user actions
   - Consistent animation timing

4. **Layout Constraints**:
   $$
   \begin{aligned}
   & \forall c \in \mathcal{C}_\Pi: c.\text{bounds} \subseteq R \\
   & \forall (p, c) \in \mathcal{H}_\Pi: c.\text{bounds} \subseteq p.\text{bounds}
   \end{aligned}
   $$

This formalism provides a complete specification for implementing the visual interface of a track player, ensuring consistent mapping between internal state and user interface elements.


