以下是您提供的正式数学文档的中文翻译，数学符号和实体名称保留英文原样：

---

### **Track-Player：形式化数学模型**  
一个通过播放控制（播放、暂停、倒带等）和可视化与时间结构（"轨道"）交互的可视化工具。系统按以下层级定义：

---  

#### **1. 时间单位 ($\tau$)**  
设 $\tau \in \mathbb{T}$ 表示**时间单位**，即一个不可分割的固定长度时间间隔。  
- **属性**：  
  - $\tau > 0$：单个时间单位的时长（例如 $\tau = 0.5\,s$ 对应 120 BPM 音乐节拍）。  
  - 作为轨道中所有时间测量的原子单位。  

---  

#### **2. 时间盒 ($T$)**  
时间盒 $T$ 表示轨道内的连续区间，定义为：  
$$  
T = (t_{\text{start}}, \text{desc})
$$  
**其中**：  
- $t_{\text{start}} \in \mathbb{D}$：$T$ 的起始时间（相对于轨道原点）。  
  - *默认值*：$t_{\text{start}} = 0$。  
- $\text{desc} \in \mathbb{S}$：时间盒内容的描述。  
  - *默认值*：$\text{desc} = \text{""}$（空字符串）。  

---  

#### **3. 段落 ($S$)**  
段落 $S$ 是有序时间盒序列：  
$$  
S = \left\langle T_1, T_2, \ldots, T_k \right\rangle  
$$  
**属性**：  
- $\text{index}(S) \in \mathbb{N}$：$S$ 在轨道中的位置。  
- $\text{desc}(S) \in \mathbb{S}$：$S$ 的文本摘要。  
- $\text{image}(S) \in \mathbb{U}$：$S$ 的视觉资源 URL。  

---  

#### **4. 轨道 ($\Theta$)**  
轨道 $\Theta$ 是元组：  
$$  
\Theta = \left( \text{id},\ \text{desc},\ \tau,\ \delta,\ n,\ \left\langle S_1, S_2, \ldots, S_m \right\rangle \right)  
$$  
**其中**：  
- $\text{id} \in \mathbb{S}$：$\Theta$ 的唯一标识符。  
  - *默认值*：$\text{id} = \text{"untitled-track"}$。  
- $\text{desc} \in \mathbb{S}$：$\Theta$ 的单句描述。  
  - *默认值*：$\text{desc} = \text{"undescribed"}$。  
- $\tau \in \mathbb{T}$：时间单位时长（见 §1）。  
  - *默认值*：$\tau = 0.5\,s$。  
- $\delta \in \mathbb{T}$：轨道前导填充时长。  
  - *默认值*：$\delta = 5$。  
  - *示例*：$\delta = 1\,\text{天}$。  
- $n \in \mathbb{N}$：每个时间盒的时间单位数。  
  - *默认值*：$n = 8$（例如 2 个 4/4 拍的小节）。  
- $\left\langle S_1, S_2, \ldots, S_m \right\rangle$：有序段落序列（见 §3）。  
  - *默认值*：空序列 $\left\langle \right\rangle$。  

---  

#### **5. 轨道状态 ($\Psi$)**  
轨道状态 $\Psi$ 表示轨道内的特定时间位置：  
$$
\Psi = \left( i,\ j,\ k \right)
$$
**其中**：
- $i \in \mathbb{N}$：当前段落在 $\Theta$ 序列中的索引。
  - $0 \leq i < |\Theta.\text{sections}|$
- $j \in \mathbb{N}$：当前时间盒在段落 $S_i$ 中的索引。
  - $0 \leq j < |S_i.\text{timeboxes}|$
- $k \in \mathbb{N}$：当前时间单位在时间盒 $T_{ij}$ 中的索引。
  - $0 \leq k < T_{ij}.n$

**属性**：
1. **初始状态**：
   $$
   \Psi_0 = (0,\ 0,\ 0)
   $$

2. **状态转移**：
   - 正向推进：
     $$
     \Psi_{t+1} = \begin{cases}
     (i,\ j,\ k+1) & \text{若 } k + 1 < T_{ij}.n \\
     (i,\ j+1,\ 0) & \text{若 } k + 1 = T_{ij}.n \text{ 且 } j + 1 < |S_i.\text{timeboxes}| \\
     (i+1,\ 0,\ 0) & \text{若 } k + 1 = T_{ij}.n \text{ 且 } j + 1 = |S_i.\text{timeboxes}| \\
     \text{未定义} & \text{其他情况}
     \end{cases}
     $$

3. **绝对时间**：
   任何状态的绝对时间位置可计算为：
   $$
   t(\Psi) = \delta + \sum_{x=0}^{i-1} \text{Duration}(S_x) + \sum_{y=0}^{j-1} \text{Duration}(T_{iy}) + k \cdot \tau
   $$

4. **状态约束**：
   $$
   \forall \Psi = (i,\ j,\ k): \begin{cases}
   0 \leq i < |\Theta.\text{sections}| \\
   0 \leq j < |S_i.\text{timeboxes}| \\
   0 \leq k < T_{ij}.n
   \end{cases}
   $$

5. **关键操作**：
   
   a. **状态推进** ($\text{advance}: \Psi \to \Psi$):
      $$
      \text{advance}(\Psi) = \begin{cases}
      (i,\ j,\ k+1) & \text{若 } k + 1 < T_{ij}.n \\
      (i,\ j+1,\ 0) & \text{若 } k + 1 = T_{ij}.n \land j + 1 < |S_i.\text{timeboxes}| \\
      (i+1,\ 0,\ 0) & \text{若 } k + 1 = T_{ij}.n \land j + 1 = |S_i.\text{timeboxes}| \land i + 1 < |\Theta.\text{sections}| \\
      \text{未定义} & \text{其他情况}
      \end{cases}
      $$

   b. **状态回退** ($\text{rewind}: \Psi \to \Psi$):
      $$
      \text{rewind}(\Psi) = \begin{cases}
      (i,\ j,\ k-1) & \text{若 } k > 0 \\
      (i,\ j-1,\ T_{i,j-1}.n-1) & \text{若 } k = 0 \land j > 0 \\
      (i-1,\ |S_{i-1}.\text{timeboxes}|-1,\ T_{i-1,\text{last}}.n-1) & \text{若 } k = 0 \land j = 0 \land i > 0 \\
      \text{未定义} & \text{其他情况}
      \end{cases}
      $$

   c. **跳转至时间** ($\text{seek}: \mathbb{R} \to \Psi$):
      $$
      \text{seek}(t) = \begin{cases}
      (i,\ j,\ k) & \text{满足 } t(\Psi) \leq t < t(\text{advance}(\Psi)) \\
      \text{未定义} & \text{若 } t < 0 \text{ 或 } t > \text{Duration}(\Theta)
      \end{cases}
      $$

   d. **段落跳转** ($\text{jumpToSection}: \mathbb{N} \to \Psi$):
      $$
      \text{jumpToSection}(i) = \begin{cases}
      (i,\ 0,\ 0) & \text{若 } 0 \leq i < |\Theta.\text{sections}| \\
      \text{未定义} & \text{其他情况}
      \end{cases}
      $$

   e. **状态验证** ($\text{isValid}: \Psi \to \{\text{true}, \text{false}\}$):
      $$
      \text{isValid}(\Psi) = \begin{cases}
      \text{true} & \text{若 } 0 \leq i < |\Theta.\text{sections}| \land \\
      & 0 \leq j < |S_i.\text{timeboxes}| \land \\
      & 0 \leq k < T_{ij}.n \\
      \text{false} & \text{其他情况}
      \end{cases}
      $$

   f. **状态比较** ($\text{compare}: \Psi \times \Psi \to \{-1, 0, 1\}$):
      $$
      \text{compare}(\Psi_1, \Psi_2) = \begin{cases}
      -1 & \text{若 } t(\Psi_1) < t(\Psi_2) \\
      0 & \text{若 } t(\Psi_1) = t(\Psi_2) \\
      1 & \text{若 } t(\Psi_1) > t(\Psi_2)
      \end{cases}
      $$

这些操作形成完整的轨道状态代数，支持：
- 轨道正反向导航
- 直接跳转至特定时间
- 基于段落的导航
- 状态验证与比较
- 与时间单位 ($\tau$) 对齐的精确时间控制

---  

### **形式化关系**  
1. **轨道总时长**：  
   $$  
   \text{Duration}(\Theta) = \delta + \sum_{S \in \Theta} \sum_{T \in S} n_T \cdot \tau  
   $$  
   其中 $n_T$ 是时间盒 $T$ 的时间单位数。  

2. **结构层级**：  
   $$  
   \Theta \to \left\langle S_1, S_2, \ldots, S_m \right\rangle \quad \text{其中} \quad S_i \to \left\langle T_{i1}, T_{i2}, \ldots, T_{ik} \right\rangle  
   $$  

3. **时间单位约束**：  
   - 所有时间操作（播放、暂停等）与 $\tau$ 粒度对齐  
   - 时间盒连续且不重叠：  
   $$  
   \forall S \in \Theta,\ \forall T_j, T_{j+1} \in S: \quad t_{\text{start}}(T_{j+1}) = t_{\text{start}}(T_j) + n_j \cdot \tau  
   $$  

---  

### **示例**  
- **时间单位**：  
  $\tau = 1\,\text{分钟} \implies \text{时间盒 } n=5 \text{ 的时长为 } 5\,\text{分钟}$  
- **轨道填充**：  
  $\delta = 7\,\text{天} \implies \text{轨道以 1 周的前导期开始}$  

此形式化模型支持精确的时间操作与可视化，以 $\tau$ 为基本测量单位。  

---  

#### **6. 轨道播放器 ($\Pi$)**  
轨道播放器 $\Pi$ 是管理轨道播放的状态系统，定义为：
$$
\Pi = \left(\Theta,\ \Psi,\ \rho,\ \nu \right)
$$
**其中**：
- $\Theta$：被播放的轨道（见 §4）
- $\Psi$：当前轨道状态（见 §5）
- $\rho \in \{\text{PLAYING}, \text{PAUSED}, \text{STOPPED}\}$：播放模式
- $\nu \in \mathbb{R}$：播放速度乘数
  - *默认值*：$\nu = 1.0$
  - *示例*：$\nu = 2.0$ 表示双倍速

**基础操作符**：

a. **播放** ($\text{play}: \Pi \to \Pi$):
   $$
   \text{play}(\Pi) = \begin{cases}
   (\Theta,\ \Psi,\ \text{PLAYING},\ \nu) & \text{若 } \text{isValid}(\Psi) \\
   (\Theta,\ \Psi_0,\ \text{PLAYING},\ \nu) & \text{若 } \Psi \text{ 未定义}
   \end{cases}
   $$

b. **暂停** ($\text{pause}: \Pi \to \Pi$):
   $$
   \text{pause}(\Pi) = (\Theta,\ \Psi,\ \text{PAUSED},\ \nu)
   $$

c. **停止** ($\text{stop}: \Pi \to \Pi$):
   $$
   \text{stop}(\Pi) = (\Theta,\ \Psi_0,\ \text{STOPPED},\ \nu)
   $$

d. **设置速度** ($\text{setSpeed}: \Pi \times \mathbb{R} \to \Pi$):
   $$
   \text{setSpeed}(\Pi,\ \nu') = \begin{cases}
   (\Theta,\ \Psi,\ \rho,\ \nu') & \text{若 } \nu' > 0 \\
   \Pi & \text{其他情况}
   \end{cases}
   $$

e. **状态更新** ($\text{tick}: \Pi \times \Delta t \to \Pi$):
   $$
   \text{tick}(\Pi,\ \Delta t) = \begin{cases}
   (\Theta,\ \text{advance}(\Psi),\ \rho,\ \nu) & \text{若 } \rho = \text{PLAYING} \land \Delta t \geq \tau/\nu \\
   \Pi & \text{其他情况}
   \end{cases}
   $$

f. **获取当前时间** ($\text{currentTime}: \Pi \to \mathbb{R}$):
   $$
   \text{currentTime}(\Pi) = t(\Psi)
   $$

g. **获取剩余时间** ($\text{remainingTime}: \Pi \to \mathbb{R}$):
   $$
   \text{remainingTime}(\Pi) = \text{Duration}(\Theta) - t(\Psi)
   $$

**状态转移**：
$$
\begin{matrix}
\text{STOPPED} & \xrightarrow{\text{play}} & \text{PLAYING} & \xrightarrow{\text{pause}} & \text{PAUSED} \\
& & \downarrow\text{stop} & & \downarrow\text{stop} \\
& & \text{STOPPED} & \xleftarrow{\text{stop}} & \text{PAUSED} \\
& & & \xrightarrow{\text{play}} &
\end{matrix}
$$

**属性**：
1. **时间量化**：
   - 所有状态更新按轨道时间单位 ($\tau$) 量化
   - $\text{tick}$ 仅在累积时间 ≥ $\tau/\nu$ 时推进状态

2. **状态不变量**：
   $$
   \begin{aligned}
   & \forall \Pi: \text{isValid}(\Pi.\Psi) \\
   & \forall \Pi: \Pi.\nu > 0 \\
   & \forall \Pi: \Pi.\rho \in \{\text{PLAYING}, \text{PAUSED}, \text{STOPPED}\}
   \end{aligned}
   $$

3. **播放约束**：
   - 仅 PLAYING 模式推进状态
   - STOPPED 状态恒等于 $\Psi = \Psi_0$
   - 速度变化保持当前位置

此形式化模型为轨道播放实现提供了完整的规范，支持精确时间控制与状态管理。

---

#### **7. 屏幕 ($\Sigma$)**  
屏幕 $\Sigma$ 是将内部状态映射至用户可见元素的视觉接口：
$$
\Sigma = \left(R,\ \mathcal{C},\ \mathcal{I},\ \mathcal{H} \right)
$$
**其中**：
- $R = (w,\ h) \in \mathbb{N}^2$：屏幕分辨率/尺寸
- $\mathcal{C}$：视觉组件集合
- $\mathcal{I}$：输入处理器集合
- $\mathcal{H}$：组件层级

**关键要素**：

1. **视觉组件** ($c \in \mathcal{C}$)：
   $$
   c = \left(id,\ \text{type},\ \text{props},\ \text{state},\ \phi \right)
   $$
   其中：
   - $id$：唯一标识符
   - $\text{type}$：组件类型（如按钮、文本）
   - $\text{props}$：静态属性
   - $\text{state}$：动态属性
   - $\phi: \text{state} \to \text{visual}$：渲染函数

2. **输入处理器** ($h \in \mathcal{I}$)：
   $$
   h: \text{Event} \times \Sigma \to \Sigma
   $$

3. **组件层级** ($\mathcal{H}$)：
   $$
   \mathcal{H} = \{(p,\ c) \in \mathcal{C} \times \mathcal{C}\ |\ p \text{ 是 } c \text{ 的父组件}\}
   $$

---  

#### **8. 轨道播放器屏幕 ($\Sigma_\Pi$)**  
专用于轨道播放器交互的屏幕：
$$
\Sigma_\Pi = \left(R,\ \mathcal{C}_\Pi,\ \mathcal{I}_\Pi,\ \mathcal{H}_\Pi,\ \Pi \right)
$$

**核心组件** ($\mathcal{C}_\Pi$)：

1. **时间线** ($\tau\text{-line}$)：
   $$
   \tau\text{-line} = \left(\text{pos},\ \text{scale},\ \mathcal{M} \right)
   $$
   其中：
   - $\text{pos} \in [0, 1]$：当前位置
   - $\text{scale} > 0$：缩放级别
   - $\mathcal{M}$：时间线标记集合

2. **控制面板** ($\kappa$)：
   $$
   \kappa = \left(\text{mode},\ \mathcal{B},\ \nu\text{-control} \right)
   $$
   其中：
   - $\text{mode}$：当前播放模式
   - $\mathcal{B}$：控制按钮集合
   - $\nu\text{-control}$：速度控制组件

3. **段落视图** ($\sigma$)：
   $$
   \sigma = \left(S_\text{current},\ \mathcal{V},\ \text{layout} \right)
   $$
   其中：
   - $S_\text{current}$：当前可见段落
   - $\mathcal{V}$：视觉元素集合
   - $\text{layout}$：布局函数

**输入处理器** ($\mathcal{I}_\Pi$)：

1. **播放控制**：
   $$
   h_\text{play}: \text{Click} \times \Pi \to \Pi
   $$

2. **时间线导航**：
   $$
   h_\text{seek}: \text{Click} \times \tau\text{-line} \times \Pi \to \Pi
   $$

3. **段落选择**：
   $$
   h_\text{section}: \text{Click} \times \sigma \times \Pi \to \Pi
   $$

**状态映射**：
$$
\phi_\Pi: \Pi \to \Sigma_\Pi
$$

**属性**：

1. **视觉一致性**：
   $$
   \forall \pi_1, \pi_2 \in \Pi: \pi_1 = \pi_2 \implies \phi_\Pi(\pi_1) = \phi_\Pi(\pi_2)
   $$

2. **时间对齐**：
   $$
   \forall t \in \mathbb{R}: \tau\text{-line}.\text{pos} = \frac{t}{\text{Duration}(\Theta)}
   $$

3. **交互反馈**：
   - 所有状态变化即时反映至 UI
   - 用户操作均有视觉反馈
   - 动画时间一致性

4. **布局约束**：
   $$
   \begin{aligned}
   & \forall c \in \mathcal{C}_\Pi: c.\text{bounds} \subseteq R \\
   & \forall (p, c) \in \mathcal{H}_\Pi: c.\text{bounds} \subseteq p.\text{bounds}
   \end{aligned}
   $$

此形式化模型为轨道播放器的视觉界面实现提供了完整规范，确保内部状态与用户界面元素的一致性映射。  

---