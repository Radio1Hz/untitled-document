**Формальная математическая модель Track-Player**  
Визуальный инструмент для взаимодействия с временными структурами ("треками") через управление воспроизведением (play, pause, rewind и т.д.) и визуализацию. Система определяется иерархически следующим образом:  

---  

#### **1. Единица времени ($\tau$)**  
Пусть $\tau \in \mathbb{T}$ обозначает **единицу времени** — неделимый временной интервал фиксированной длины.  
- **Свойства**:  
  - $\tau > 0$: Длительность одной единицы времени (например, $\tau = 0.5\,s$ для музыкального бита в 120 BPM).  
  - Служит атомарной единицей для всех временных измерений в треке.  

---  

#### **2. Timebox ($T$)**  
Timebox $T$ представляет непрерывный интервал внутри трека, определяемый как:  
$$  
T = (t_{\text{start}}, \text{desc})
$$  
**где**:  
- $t_{\text{start}} \in \mathbb{D}$: Время начала $T$ относительно начала трека.  
  - *По умолчанию*: $t_{\text{start}} = 0$.  
- $\text{desc} \in \mathbb{S}$: Описание содержимого timebox.  
  - *По умолчанию*: $\text{desc} = \text{""}$ (пустая строка).  

---  

#### **3. Section ($S$)**  
Section $S$ — упорядоченная последовательность timebox:  
$$  
S = \left\langle T_1, T_2, \ldots, T_k \right\rangle  
$$  
**Свойства**:  
- $\text{index}(S) \in \mathbb{N}$: Позиция $S$ в треке.  
- $\text{desc}(S) \in \mathbb{S}$: Краткое текстовое описание $S$.  
- $\text{image}(S) \in \mathbb{U}$: URL визуального ресурса для $S$.  

---  

#### **4. Track ($\Theta$)**  
Трек $\Theta$ определяется как кортеж:  
$$  
\Theta = \left( \text{id},\ \text{desc},\ \tau,\ \delta,\ n,\ \left\langle S_1, S_2, \ldots, S_m \right\rangle \right)  
$$  
**где**:  
- $\text{id} \in \mathbb{S}$: Уникальный идентификатор $\Theta$.  
  - *По умолчанию*: $\text{id} = \text{"untitled-track"}$.  
- $\text{desc} \in \mathbb{S}$: Краткое описание трека.  
  - *По умолчанию*: $\text{desc} = \text{"undescribed"}$.  
- $\tau \in \mathbb{T}$: Длительность единицы времени (см. §1).  
  - *По умолчанию*: $\tau = 0.5\,s$.  
- $\delta \in \mathbb{T}$: Длительность заполнения перед началом трека.  
  - *По умолчанию*: $\delta = 5$.  
  - *Пример*: $\delta = 1\,\text{день}$.  
- $n \in \mathbb{N}$: Количество единиц времени в одном timebox.  
  - *По умолчанию*: $n = 8$ (например, 2 музыкальных такта 4/4).  
- $\left\langle S_1, S_2, \ldots, S_m \right\rangle$: Упорядоченная последовательность section (см. §3).  
  - *По умолчанию*: Пустая последовательность $\left\langle \right\rangle$.  

---  

#### **5. Состояние трека ($\Psi$)**  
Состояние трека $\Psi$ представляет конкретную временную позицию внутри трека:  
$$  
\Psi = \left( i,\ j,\ k \right)  
$$  
**где**:  
- $i \in \mathbb{N}$: Индекс текущей section в последовательности $\Theta$.  
  - $0 \leq i < |\Theta.\text{sections}|$  
- $j \in \mathbb{N}$: Индекс текущего timebox в section $S_i$.  
  - $0 \leq j < |S_i.\text{timeboxes}|$  
- $k \in \mathbb{N}$: Индекс текущей единицы времени в timebox $T_{ij}$.  
  - $0 \leq k < T_{ij}.n$  

**Свойства**:  
1. **Начальное состояние**:  
   $$  
   \Psi_0 = (0,\ 0,\ 0)  
   $$  

2. **Переходы состояний**:  
   - Прогресс вперед:  
     $$  
     \Psi_{t+1} = \begin{cases}  
     (i,\ j,\ k+1) & \text{если } k + 1 < T_{ij}.n \\  
     (i,\ j+1,\ 0) & \text{если } k + 1 = T_{ij}.n \text{ и } j + 1 < |S_i.\text{timeboxes}| \\  
     (i+1,\ 0,\ 0) & \text{если } k + 1 = T_{ij}.n \text{ и } j + 1 = |S_i.\text{timeboxes}| \\  
     \text{не определено} & \text{иначе}  
     \end{cases}  
     $$  

3. **Абсолютное время**:  
   Абсолютная временная позиция для любого состояния:  
   $$  
   t(\Psi) = \delta + \sum_{x=0}^{i-1} \text{Duration}(S_x) + \sum_{y=0}^{j-1} \text{Duration}(T_{iy}) + k \cdot \tau  
   $$  

4. **Ограничения состояний**:  
   $$  
   \forall \Psi = (i,\ j,\ k): \begin{cases}  
   0 \leq i < |\Theta.\text{sections}| \\  
   0 \leq j < |S_i.\text{timeboxes}| \\  
   0 \leq k < T_{ij}.n  
   \end{cases}  
   $$  

5. **Ключевые операции**:  
   a. **Переход вперед** ($\text{advance}: \Psi \to \Psi$):  
      $$  
      \text{advance}(\Psi) = \begin{cases}  
      (i,\ j,\ k+1) & \text{если } k + 1 < T_{ij}.n \\  
      (i,\ j+1,\ 0) & \text{если } k + 1 = T_{ij}.n \land j + 1 < |S_i.\text{timeboxes}| \\  
      (i+1,\ 0,\ 0) & \text{если } k + 1 = T_{ij}.n \land j + 1 = |S_i.\text{timeboxes}| \land i + 1 < |\Theta.\text{sections}| \\  
      \text{не определено} & \text{иначе}  
      \end{cases}  
      $$  

   b. **Переход назад** ($\text{rewind}: \Psi \to \Psi$):  
      $$  
      \text{rewind}(\Psi) = \begin{cases}  
      (i,\ j,\ k-1) & \text{если } k > 0 \\  
      (i,\ j-1,\ T_{i,j-1}.n-1) & \text{если } k = 0 \land j > 0 \\  
      (i-1,\ |S_{i-1}.\text{timeboxes}|-1,\ T_{i-1,\text{last}}.n-1) & \text{если } k = 0 \land j = 0 \land i > 0 \\  
      \text{не определено} & \text{иначе}  
      \end{cases}  
      $$  

   c. **Переход ко времени** ($\text{seek}: \mathbb{R} \to \Psi$):  
      $$  
      \text{seek}(t) = \begin{cases}  
      (i,\ j,\ k) & \text{где } t(\Psi) \leq t < t(\text{advance}(\Psi)) \\  
      \text{не определено} & \text{если } t < 0 \text{ или } t > \text{Duration}(\Theta)  
      \end{cases}  
      $$  

   d. **Переход к section** ($\text{jumpToSection}: \mathbb{N} \to \Psi$):  
      $$  
      \text{jumpToSection}(i) = \begin{cases}  
      (i,\ 0,\ 0) & \text{если } 0 \leq i < |\Theta.\text{sections}| \\  
      \text{не определено} & \text{иначе}  
      \end{cases}  
      $$  

   e. **Проверка состояния** ($\text{isValid}: \Psi \to \{\text{true}, \text{false}\}$):  
      $$  
      \text{isValid}(\Psi) = \begin{cases}  
      \text{true} & \text{если } 0 \leq i < |\Theta.\text{sections}| \land \\  
      & 0 \leq j < |S_i.\text{timeboxes}| \land \\  
      & 0 \leq k < T_{ij}.n \\  
      \text{false} & \text{иначе}  
      \end{cases}  
      $$  

   f. **Сравнение состояний** ($\text{compare}: \Psi \times \Psi \to \{-1, 0, 1\}$):  
      $$  
      \text{compare}(\Psi_1, \Psi_2) = \begin{cases}  
      -1 & \text{если } t(\Psi_1) < t(\Psi_2) \\  
      0 & \text{если } t(\Psi_1) = t(\Psi_2) \\  
      1 & \text{если } t(\Psi_1) > t(\Psi_2)  
      \end{cases}  
      ```  

Эти операции образуют полную алгебру для управления состоянием трека, обеспечивая:  
- Навигацию вперед и назад  
- Прямой переход к заданному времени  
- Навигацию по section  
- Проверку и сравнение состояний  
- Точный временной контроль в соответствии с $\tau$  

---  

### **Формальные соотношения**  
1. **Общая длительность трека**:  
   $$  
   \text{Duration}(\Theta) = \delta + \sum_{S \in \Theta} \sum_{T \in S} n_T \cdot \tau  
   $$  
   где $n_T$ — количество единиц времени в timebox $T$.  

2. **Иерархия структуры**:  
   $$  
   \Theta \to \left\langle S_1, S_2, \ldots, S_m \right\rangle \quad \text{где} \quad S_i \to \left\langle T_{i1}, T_{i2}, \ldots, T_{ik} \right\rangle  
   $$  

3. **Ограничения времени**:  
   - Все операции (play, pause и т.д.) синхронизированы с гранулярностью $\tau$.  
   - Timebox непрерывны и не пересекаются:  
   $$  
   \forall S \in \Theta,\ \forall T_j, T_{j+1} \in S: \quad t_{\text{start}}(T_{j+1}) = t_{\text{start}}(T_j) + n_j \cdot \tau  
   $$  

---  

### **Примеры**  
- **Единица времени**:  
  $\tau = 1\,\text{минута} \implies \text{Timebox с } n=5 \text{ имеет длительность } 5\,\text{минут}.$  
- **Заполнение трека**:  
  $\delta = 7\,\text{дней} \implies \text{Трек начинается с 7-дневного периода}.$  

---  

#### **6. Track Player ($\Pi$)**  
Track Player $\Pi$ — система управления воспроизведением трека, определяемая как:  
$$  
\Pi = \left(\Theta,\ \Psi,\ \rho,\ \nu \right)  
$$  
**где**:  
- $\Theta$: Воспроизводимый трек (см. §4)  
- $\Psi$: Текущее состояние трека (см. §5)  
- $\rho \in \{\text{PLAYING}, \text{PAUSED}, \text{STOPPED}\}$: Режим воспроизведения  
- $\nu \in \mathbb{R}$: Множитель скорости воспроизведения  
  - *По умолчанию*: $\nu = 1.0$  
  - *Пример*: $\nu = 2.0$ для двойной скорости  

**Операции**:  
a. **Play** ($\text{play}: \Pi \to \Pi$):  
   $$  
   \text{play}(\Pi) = \begin{cases}  
   (\Theta,\ \Psi,\ \text{PLAYING},\ \nu) & \text{если } \text{isValid}(\Psi) \\  
   (\Theta,\ \Psi_0,\ \text{PLAYING},\ \nu) & \text{если } \Psi \text{ не определено}  
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

d. **Изменение скорости** ($\text{setSpeed}: \Pi \times \mathbb{R} \to \Pi$):  
   $$  
   \text{setSpeed}(\Pi,\ \nu') = \begin{cases}  
   (\Theta,\ \Psi,\ \rho,\ \nu') & \text{если } \nu' > 0 \\  
   \Pi & \text{иначе}  
   \end{cases}  
   $$  

e. **Обновление состояния** ($\text{tick}: \Pi \times \Delta t \to \Pi$):  
   $$  
   \text{tick}(\Pi,\ \Delta t) = \begin{cases}  
   (\Theta,\ \text{advance}(\Psi),\ \rho,\ \nu) & \text{если } \rho = \text{PLAYING} \land \Delta t \geq \tau/\nu \\  
   \Pi & \text{иначе}  
   \end{cases}  
   $$  

**Переходы состояний**:  
$$  
\begin{matrix}  
\text{STOPPED} & \xrightarrow{\text{play}} & \text{PLAYING} & \xrightarrow{\text{pause}} & \text{PAUSED} \\  
& & \downarrow\text{stop} & & \downarrow\text{stop} \\  
& & \text{STOPPED} & \xleftarrow{\text{stop}} & \text{PAUSED} \\  
& & & \xrightarrow{\text{play}} &  
\end{matrix}  
$$  

**Свойства**:  
1. **Квантование времени**:  
   - Все обновления состояния синхронизированы с $\tau$.  
   - $\text{tick}$ изменяет состояние только при $\Delta t \geq \tau/\nu$.  

2. **Инварианты**:  
   $$  
   \forall \Pi: \text{isValid}(\Pi.\Psi),\ \Pi.\nu > 0,\ \Pi.\rho \in \{\text{PLAYING}, \text{PAUSED}, \text{STOPPED}\}  
   $$  

---  

#### **7. Экран ($\Sigma$)**  
Экран $\Sigma$ — визуальный интерфейс, отображающий состояние системы:  
$$  
\Sigma = \left(R,\ \mathcal{C},\ \mathcal{I},\ \mathcal{H} \right)  
$$  
**где**:  
- $R = (w,\ h)$: Разрешение экрана  
- $\mathcal{C}$: Визуальные компоненты (кнопки, текст и т.д.)  
- $\mathcal{I}$: Обработчики ввода  
- $\mathcal{H}$: Иерархия компонентов  

**Пример для Track Player**:  
- **Timeline**: Отображение позиции $\Psi$  
- **Control Panel**: Кнопки управления ($\text{play}$, $\text{pause}$)  
- **Section View**: Визуализация текущей section $S_i$  

**Требования**:  
- Мгновенное обновление при изменении $\Psi$  
- Визуальная согласованность с $\tau$-гранулярностью  
- Анимации, синхронизированные с $\nu$.  

Эта модель обеспечивает точное управление временем и состоянием, сохраняя все математические гарантии.