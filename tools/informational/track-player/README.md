### Track-Player: Formal Mathematical Model  
A visual tool for interacting with temporal structures ("tracks") through playback control (play, pause, rewind, etc.) and visualization. The system is defined hierarchically as follows:  

https://untitled-document.net/tools/informational/track-player/#1

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
T = (\text{description}, n_T, \text{imageUrl})
$$  
**where**:  
- $\text{description} \in \mathbb{S}$: Description of the timebox content.
  - *Default*: $\text{description} = \text{""}$ (empty string).  
- $n_T \in \mathbb{N}$: Number of time units in this timebox.
  - *Optional*: If undefined, inherits from track's $n$ attribute.
- $\text{imageUrl} \in \mathbb{U} \cup \{\text{null}\}$: URL of visual asset for timebox.
  - *Default*: $\text{imageUrl} = \text{null}$

---  

#### **3. Section ($S$)**  
A section $S$ is an ordered sequence of timeboxes with visual content:  
$$  
S = \left(\left\langle T_1, T_2, \ldots, T_k \right\rangle, \text{description}, \text{imageUrl}\right)  
$$  
**with properties**:  
- $\text{index}(S) \in \mathbb{N}$: Position of $S$ in the track.  
- $\text{description}(S) \in \mathbb{S}$: Brief textual summary of $S$.  
- $\text{imageUrl}(S) \in \mathbb{U}$: URL of a visual asset for $S$.  

---  

#### **4. Action ($\alpha$)**
An action $\alpha$ represents a trigger point within a track's timeline:
$$
\alpha = (\psi_{\text{start}}, \text{id})
$$
**where**:
- $\psi_{\text{start}} = (i,j,k) \in \mathbb{N}^3$: State vector triggering action start
  - $i$: Section index
  - $j$: Timebox index within section
  - $k$: Position index within timebox
- $\text{id} \in \mathbb{N}^+$: Unique identifier for this action

**Properties**:
1. **Uniqueness**: $\forall \alpha_1, \alpha_2 \in \mathcal{A}: \alpha_1.\text{id} = \alpha_2.\text{id} \implies \alpha_1 = \alpha_2$
2. **Validity**: $\psi_{\text{start}}$ must reference valid indices within track structure

---  

#### **5. Track ($\Theta$)**  
A track $\Theta$ is a tuple:  
$$  
\Theta = \left( \text{id},\ \text{description},\ \tau,\ \delta,\ n,\ \tau_\omega,\ \text{dedication},\ \mathcal{A},\ \left\langle S_1, S_2, \ldots, S_m \right\rangle \right)  
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
- $\tau_\omega \in \mathbb{T}_\omega}$: World time anchor point for track start
  - *Format*: $\text{yyyy-mm-dd hh:mm:ss.cc}$
  - *Type*: High-resolution timestamp
  - *Example*: $\tau_\omega = \text{"2024-03-19 15:30:00.00"}$
  - *Optional*: If undefined, this value is set to current time when track playback is initiated manually
- $\text{dedication} \in \mathbb{S}$: Dedication text
  - *Type*: Optional textual dedication
  - *Default*: empty string
  - *Example*: $\text{dedication} = \text{"To the concept of eternal return"}$
- $\mathcal{A}$: Set of track actions where each $a \in \mathcal{A}$ is defined as:
  $$
  a = (\psi_{\text{start}}, \text{id})
  $$
  where:
  - $\psi_{\text{start}} = (i,j,k)$: State triggering action start
  - $\text{id} \in \mathbb{N}^+$: Unique action identifier
- $\left\langle S_1, S_2, \ldots, S_m \right\rangle$: Ordered sequence of sections (see §3).  
  - *Default*: Empty sequence $\left\langle \right\rangle$.  

---  

#### **6. Visual Component ($c$)**
A visual component $c$ is defined as:
$$
c = (\text{id}, \text{type}, \text{props}, \text{state}, \phi)
$$
**where**:
- $\text{id} \in \mathbb{S}$: Unique identifier
- $\text{type} \in \{\text{canvas}, \text{timeline}, \text{control}, \text{section}\}$
- $\text{props}$: Static properties
- $\text{state}$: Dynamic properties
- $\phi: \text{state} \to \text{visual}$: Render function

---  

#### **7. Canvas Component ($C$)**
A canvas component $C$ extends visual component for media display:
$$
C = (w, h, \text{ctx}, \text{content})
$$
**where**:
- $w, h \in \mathbb{N}$: Width and height (square: $w = h = \min(\text{container}_w, \text{container}_h)$)
- $\text{ctx}$: 2D rendering context
- $\text{content}$: Current media content
- $\text{state} = \{\text{currentUrl}, \text{isLoading}, \text{error}\}$

**Properties**:
1. **Square Aspect Ratio**:
   $$
   w = h = \min(\text{container}_w, \text{container}_h)
   $$

2. **Content Scaling**:
   $$
   \text{scale} = \min(\frac{w}{\text{content}_w}, \frac{h}{\text{content}_h})
   $$

3. **Center Positioning**:
   $$
   \begin{aligned}
   x &= \frac{w - \text{content}_w \cdot \text{scale}}{2} \\
   y &= \frac{h - \text{content}_h \cdot \text{scale}}{2}
   \end{aligned}
   $$

---  

#### **8. Screen ($\Sigma$)**
A screen $\Sigma$ represents the complete visual interface:
$$
\Sigma = (R, \mathcal{C}, \mathcal{I}, \mathcal{H}, \mathcal{D})
$$
**where**:
- $R = (w, h)$: Screen resolution
- $\mathcal{C}$: Set of components including $\{C, \tau\text{-line}, \text{controls}, \text{sections}\}$
- $\mathcal{I}$: Set of input handlers
- $\mathcal{H}$: Component hierarchy
- $\mathcal{D}$: Event dispatcher

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

#### **9. Track Player Screen ($\Sigma_\Pi$)**
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

#### **10. Playlist ($\mathcal{P}$)**
A playlist represents an ordered collection of tracks with additional playback behaviors:
$$
\mathcal{P} = (\Theta_\text{set}, \text{order}, \text{mode}, \text{history})
$$
**where**:
- $\Theta_\text{set} = \{\Theta_1, \Theta_2, ..., \Theta_n\}$: Set of tracks
- $\text{order}: \mathbb{N} \to \Theta_\text{set}$: Current playback order
- $\text{mode} \in \{\text{SEQUENTIAL}, \text{REPEAT{\text{-}}ONE}, \text{REPEAT{\text{-}}ALL}\}$: Playlist mode
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
\Theta_{\text{current}} & \text{if mode} = \text{REPEAT{\text{-}}ONE} \\
\text{order}[i + 1] & \text{if mode} = \text{SEQUENTIAL} \\
\text{order}[0] & \text{if mode} = \text{REPEAT{\text{-}}ALL} \text{ and } i = |\Theta_{\text{set}}| - 1 \\
\text{random}(\Theta_{\text{set}}) & \text{if mode} = \text{SHUFFLE}
\end{cases}
$$


