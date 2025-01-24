### Track-Player: Formal Mathematical Specification  
A visual tool for interacting with temporal structures ("tracks") through playback control (play, pause, rewind, etc.) and visualization. The system is defined hierarchically as follows:  

---  

#### **1. Time Unit (```math τ```)**  
Let ```math τ ∈ \mathbb{T}``` denote the **time unit**, an indivisible temporal interval of fixed length.  
- **Properties**:  
  - ```math τ > 0```: Duration of one time unit (e.g., ```math τ = 0.5\,s``` for a 120 BPM musical beat).  
  - Acts as the atomic unit for all temporal measurements in the track.  

---  

#### **2. Timebox (```math T```)**  
A timebox ```math T``` is a contiguous interval within a track, defined by:  
```math
T = \left( t_{\text{start}},\ n \right)  
```
**where**:  
- ```math t_{\text{start}} ∈ \mathbb{D}```: Start time of ```math T```, relative to the track's origin.  
  - *Default*: ```math t_{\text{start}} = 0```.  
- ```math n ∈ \mathbb{N}```: Number of time units in ```math T```, defining its duration as ```math n \cdot τ```.  
  - *Default*: ```math n = 8``` (e.g., 2 musical measures of 4/4).  

---  

#### **3. Section (```math S```)**  
A section ```math S``` is an ordered sequence of timeboxes:  
```math
S = \left\langle T_1, T_2, \ldots, T_k \right\rangle  
```
**with properties**:  
- ```math \text{index}(S) ∈ \mathbb{N}```: Position of ```math S``` in the track.  
- ```math \text{description}(S) ∈ \mathbb{S}```: Brief textual summary of ```math S```.  
- ```math \text{image}(S) ∈ \mathbb{U}```: URL of a visual asset for ```math S```.  

---  

#### **4. Track (```math \Theta```)**  
A track ```math \Theta``` is a tuple:  
```math
\Theta = \left( \text{id},\ \text{desc},\ τ,\ δ,\ \left\langle S_1, S_2, \ldots, S_m \right\rangle \right)  
```
**where**:  
- ```math \text{id} ∈ \mathbb{S}```: Unique identifier for ```math \Theta```.  
  - *Default*: ```math \text{id} = \text{"untitled-track"}```.  
- ```math \text{desc} ∈ \mathbb{S}```: Single-sentence description of ```math \Theta```.  
  - *Default*: ```math \text{desc} = \text{"undescribed"}```.  
- ```math τ ∈ \mathbb{T}```: Duration of one time unit (see §1).  
  - *Default*: ```math τ = 0.5\,s```.  
- ```math δ ∈ \mathbb{T}```: Padding duration prepended to the track.  
  - *Default*: ```math δ = 0```.  
  - *Example*: ```math δ = 1\,\text{day}```.  
- ```math \left\langle S_1, S_2, \ldots, S_m \right\rangle```: Ordered sequence of sections (see §3).  
  - *Default*: Empty sequence ```math \left\langle \right\rangle```.  

---  

### **Formal Relationships**  
1. **Total Duration of a Track**:  
   ```math
   \text{Duration}(\Theta) = δ + \sum_{S ∈ \Theta} \sum_{T ∈ S} n_T \cdot τ  
   ```
   where ```math n_T``` is the number of time units in timebox ```math T```.  

2. **Structure Hierarchy**:  
   ```math
   \Theta \to \left\langle S_1, S_2, \ldots, S_m \right\rangle \quad \text{where} \quad S_i \to \left\langle T_{i1}, T_{i2}, \ldots, T_{ik} \right\rangle  
   ```

3. **Time Unit Constraints**:  
   - All temporal operations (play, pause, etc.) align with ```math τ```-granularity.  
   - Timeboxes are contiguous and non-overlapping:  
   ```math
   \forall S ∈ \Theta,\ \forall T_j, T_{j+1} ∈ S: \quad t_{\text{start}}(T_{j+1}) = t_{\text{start}}(T_j) + n_j \cdot τ  
   ```

---  

### **Examples**  
- **Time Unit**:  
  ```math τ = 1\,\text{minute} \implies \text{A timebox with } n=5 \text{ has duration } 5\,\text{minutes}.```
- **Track Padding**:  
  ```math δ = 7\,\text{days} \implies \text{The track begins with a 1-week lead-in period}.```

This formalism enables precise temporal manipulation and visualization, with ```math τ``` as the foundational unit of measure.

```math
\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
```
