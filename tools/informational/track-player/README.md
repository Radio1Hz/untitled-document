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
T = (\text{description}, n_T)
$$  
**where**:  
- $\text{description} \in \mathbb{S}$: Description of the timebox content.
  - *Default*: $\text{description} = \text{""}$ (empty string).
- $n_T \in \mathbb{N}$: Number of time units in this timebox.
  - *Optional*: If undefined, inherits from track's $n$ attribute.

---  

#### **3. Section ($S$)**  
A section $S$ is an ordered sequence of timeboxes:  
$$  
S = \left\langle T_1, T_2, \ldots, T_k \right\rangle  
$$  
**with properties**:  
- $\text{index}(S) \in \mathbb{N}$: Position of $S$ in the track.  
- $\text{description}(S) \in \mathbb{S}$: Brief textual summary of $S$.  
- $\text{image}(S) \in \mathbb{U}$: URL of a visual asset for $S$.  

---  

#### **4. Track ($\Theta$)**  
A track $\Theta$ is a tuple:  
$$  
\Theta = \left( \text{id},\ \text{description},\ \tau,\ \delta,\ n,\ \tau_\omega,\ \text{dedication},\ \left\langle S_1, S_2, \ldots, S_m \right\rangle \right)  
$$  
**where**:  
- $\text{id} \in \mathbb{S}$: Unique identifier for $\Theta$.  
  - *Default*: $\text{id} = \text{"untitled-track"}$.  
- $\text{description} \in \mathbb{S}$: Single-sentence description of $\Theta$.  
  - *Default*: $\text{description} = \text{"undescribed"}$.  
- $\tau \in \mathbb{T}$: Duration of one time unit (see §1).  
  - *Default*: $\tau = 0.5\,s$.  
- $\delta \in \mathbb{T}$: Padding duration prepended to the track.  
  - *Default*: $\delta = 0$.  
  - *Example*: $\delta = 1\,\text{day}$.  
- $n \in \mathbb{N}$: Default number of time units per timebox
  - *Default*: $n = 8$ (e.g., 2 musical measures of 4/4).
  - *Note*: Individual timeboxes may override this value with their own $n_T$.
- $\tau_\omega \in \mathbb{T}_\omega$: World time anchor point for track start
  - *Format*: $\text{yyyy-mm-dd hh:mm:ss.cc}$
  - *Type*: High-resolution timestamp
  - *Example*: $\tau_\omega = \text{"2024-03-19 15:30:00.00"}$
  - *Optional*: If undefined, this value is set to current time when track playback is initiated manually
- $\text{dedication} \in \mathbb{S}$: Dedication text
  - *Type*: Optional textual dedication
  - *Default*: empty string
  - *Example*: $\text{dedication} = \text{"To the concept of eternal return"}$
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
   \text{Duration}(\Theta) = \delta + \sum_{S \in \Theta} \sum_{T \in S} n_{T,\text{eff}} \cdot \tau  
   $$  
   where $n_{T,\text{eff}}$ is the effective number of time units for timebox $T$:
   $$
   n_{T,\text{eff}} = \begin{cases}
   n_T & \text{if}\ n_T\ \text{is defined} \\
   \Theta.n & \text{otherwise}
   \end{cases}
   $$

2. **Structure Hierarchy**:  
   $$  
   \Theta \to \left\langle S_1, S_2, \ldots, S_m \right\rangle \quad \text{where} \quad S_i \to \left\langle T_{i1}, T_{i2}, \ldots, T_{ik} \right\rangle  
   $$  

3. **Time Unit Constraints**:  
   - All temporal operations (play, pause, etc.) align with $\tau$-granularity.  
   - Timeboxes are contiguous and non-overlapping within sections
   $$  
   \forall S \in \Theta: \text{Duration}(S) = \sum_{T \in S} n_{T,\text{eff}} \cdot \tau  
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
\Pi = (\mathcal{P},\ \Theta_\text{current},\ \Psi,\ \rho,\ \nu,\ \lambda,\ \delta_p,\ t,\ t_a)
$$
**where**:
- $\mathcal{P} = \{\Theta_1, \Theta_2, ..., \Theta_n\}$: Ordered set of tracks (playlist)
- $\Theta_\text{current} \in \mathcal{P}$: Currently selected track
- $\Psi$: Current state of $\Theta_\text{current}$
- $\rho \in \{\text{PLAYING}, \text{PAUSED}, \text{STOPPED}, \text{LOADING}\}$: Playback mode
- $\nu > 0$: Speed multiplier
- $\lambda \in \{\text{true}, \text{false}\}$: Looping enabled state
- $\delta_p \in \mathbb{R}^+$: Playback predelay in milliseconds
- $t \in \mathbb{R}^+$: Current absolute time position
- $t_a \in \mathbb{R}^+$: Accumulated time since last state update

**Properties**:

1. **Playlist Operations**:
   
   a. **Add Track** ($\text{addTrack}: \Theta \to \mathcal{P}$):
      $$
      \text{addTrack}(\Theta) = \mathcal{P} \cup \{\Theta\}
      $$

   b. **Remove Track** ($\text{removeTrack}: \Theta \to \mathcal{P}$):
      $$
      \text{removeTrack}(\Theta) = \mathcal{P} \setminus \{\Theta\}
      $$

   c. **Select Track** ($\text{selectTrack}: \mathbb{N} \to \Theta$):
      $$
      \text{selectTrack}(i) = \begin{cases}
      \Theta_i & \text{if } 0 \leq i < |\mathcal{P}| \\
      \text{undefined} & \text{otherwise}
      \end{cases}
      $$

2. **Time Quantization**:
   - All state updates are quantized to track's time unit ($\tau$)
   - $\text{tick}$ advances state only when accumulated time ≥ $\tau/\nu$

3. **State Invariants**:
   $$
   \begin{aligned}
   & \forall \Pi: \text{isValid}(\Pi.\Psi) \\
   & \forall \Pi: \Pi.\nu > 0 \\
   & \forall \Pi: \Pi.\rho \in \{\text{PLAYING}, \text{PAUSED}, \text{STOPPED}, \text{LOADING}\} \\
   & \forall \Pi: \Pi.\lambda \in \{\text{true}, \text{false}\}
   \end{aligned}
   $$

4. **Playback Constraints**:
   - State advances only in PLAYING mode
   - STOPPED state always implies $\Psi = \Psi_0$
   - Speed changes preserve current position
   - When $\lambda = \text{true}$, reaching end of track resets to $\Psi_0$ and continues playing
   - When $\lambda = \text{false}$, reaching end of track transitions to STOPPED mode

5. **Looping Behavior**:
   $$
   \text{advance}(\Psi, \lambda) = \begin{cases}
   \Psi_0 & \text{if}\ \lambda = \text{true}\ \text{and}\ \text{advance}(\Psi) = \text{undefined} \\
   \text{advance}(\Psi) & \text{otherwise}
   \end{cases}
   $$

   $$
   \text{calculateState}(t, \lambda) = \begin{cases}
   \Psi_0 & \text{if}\ \lambda = \text{true}\ \text{and}\ t \geq \text{Duration}(\Theta_\text{current}) \\
   \text{seek}(t) & \text{if}\ t < \text{Duration}(\Theta_\text{current}) \\
   \Psi_\text{final} & \text{otherwise}
   \end{cases}
   $$

This formalism provides a complete specification for implementing track playback with precise temporal control and state management.

---

#### **7. Screen ($\Sigma$)**
A screen $\Sigma$ is a visual interface that maps internal state to user-visible elements:
$$
\Sigma = \left(R,\ \mathcal{C},\ \mathcal{I},\ \mathcal{H},\ D \right)
$$
**where**:
- $R = (w,\ h) \in \mathbb{N}^2$: Screen resolution/dimensions
- $\mathcal{C}$: Set of visual components
- $\mathcal{I}$: Set of input handlers
- $\mathcal{H}$: Component hierarchy
- $D = (3000,\ 3000) \in \mathbb{N}^2$: Default dimension (width, height)

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

**Additional State Properties**:
$$
\text{currentIndex}(\Pi) = \begin{cases}
i & \text{if}\ \Theta_\text{current} = \mathcal{P}[i] \\
-1 & \text{if}\ \Theta_\text{current} = \text{null}
\end{cases}
$$

**Time Management**:
$$
\text{effectiveTime}(t) = \max(0,\ t - \delta_p/1000)
$$

**State Advancement with Predelay**:
$$
\text{advance}(\Psi, \lambda, t) = \begin{cases}
\Psi_0 & \text{if}\ t < \delta_p/1000 \\
\Psi_0 & \text{if}\ \lambda = \text{true}\ \text{and}\ \text{advance}(\Psi) = \text{undefined} \\
\text{advance}(\Psi) & \text{otherwise}
\end{cases}
$$

#### **9. Playlist ($\mathcal{P}$)**
A playlist represents an ordered collection of tracks with additional playback behaviors:
$$
\mathcal{P} = (\Theta_\text{set}, \text{order}, \text{mode}, \text{history})
$$
**where**:
- $\Theta_\text{set} = \{\Theta_1, \Theta_2, ..., \Theta_n\}$: Set of tracks
- $\text{order}: \mathbb{N} \to \Theta_\text{set}$: Current playback order
- $\text{mode} \in \{\text{SEQUENTIAL}, \text{SHUFFLE}, \text{REPEAT_ONE}, \text{REPEAT_ALL}\}$: Playlist mode
- $\text{history}: \text{Stack}(\Theta)$: Track playback history

**Operations**:

1. **Track Management**:
   $$
   \begin{aligned}
   \text{add}: \Theta &\to \mathcal{P} \\
   \text{remove}: \Theta &\to \mathcal{P} \\
   \text{reorder}: \mathbb{N} \times \mathbb{N} &\to \text{order}
   \end{aligned}
   $$

2. **Navigation**:
   $$
   \begin{aligned}
   \text{next}: \mathcal{P} &\to \Theta \\
   \text{previous}: \mathcal{P} &\to \Theta \\
   \text{jump}: \mathbb{N} &\to \Theta
   \end{aligned}
   $$

3. **Shuffle Operation**:
   $$
   \text{shuffle}: \text{order} \to \text{order}'
   $$
   where $\text{order}'$ is a random permutation of $\text{order}$

4. **History Management**:
   $$
   \begin{aligned}
   \text{pushHistory}: \Theta &\to \text{history} \\
   \text{popHistory}: \text{history} &\to \Theta
   \end{aligned}
   $$

**State Transitions**:
$$
\text{nextTrack}(\mathcal{P}) = \begin{cases}
\Theta_\text{current} & \text{if mode} = \text{REPEAT_ONE} \\
\text{order}[i + 1] & \text{if mode} = \text{SEQUENTIAL} \\
\text{order}[0] & \text{if mode} = \text{REPEAT_ALL and } i = |\Theta_\text{set}| - 1 \\
\text{random}(\Theta_\text{set}) & \text{if mode} = \text{SHUFFLE}
\end{cases}
$$


