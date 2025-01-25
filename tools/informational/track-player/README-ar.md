**النموذج الرياضي الرسمي لمشغل المسارات (Track-Player)**  
أداة بصرية للتفاعل مع البُنى الزمنية ("المسارات") عبر التحكم في التشغيل (تشغيل، إيقاف مؤقت، إعادة، إلخ) والتصور. يُعرَّف النظام بشكل هرمي كالتالي:  

---  

#### **١. وحدة الزمن ($\tau$)**  
ليكن $\tau \in \mathbb{T}$ يمثل **وحدة الزمن**، وهي فاصل زمني غير قابل للتجزئة وثابت الطول.  
- **الخصائص**:  
  - $\tau > 0$: مدة وحدة زمن واحدة (مثال: $\tau = 0.5\,s$ لإيقاع موسيقي بسرعة 120 دقة في الدقيقة).  
  - تُستخدم كوحدة أساسية لجميع القياسات الزمنية في المسار.  

---  

#### **٢. صندوق الزمن (Timebox $T$)**  
صندوق الزمن $T$ يمثل فاصلًا زمنيًا متصلًا داخل المسار، يُعرَّف بـ:  
$$  
T = (t_{\text{start}}, \text{desc})  
$$  
**حيث**:  
- $t_{\text{start}} \in \mathbb{D}$: وقت بدء $T$ نسبة إلى بداية المسار.  
  - *القيمة الافتراضية*: $t_{\text{start}} = 0$.  
- $\text{desc} \in \mathbb{S}$: وصف لمحتوى صندوق الزمن.  
  - *القيمة الافتراضية*: $\text{desc} = \text{""}$ (سلسلة نصية فارغة).  

---  

#### **٣. القسم (Section $S$)**  
القسم $S$ هو تسلسل مرتب لصناديق الزمن:  
$$  
S = \left\langle T_1, T_2, \ldots, T_k \right\rangle  
$$  
**الخصائص**:  
- $\text{index}(S) \in \mathbb{N}$: موقع $S$ في تسلسل المسار.  
- $\text{desc}(S) \in \mathbb{S}$: ملخص نصي مختصر لـ $S$.  
- $\text{image}(S) \in \mathbb{U}$: رابط لملف مرئي (صورة/فيديو) لـ $S$.  

---  

#### **٤. المسار ($\Theta$)**  
المسار $\Theta$ هو مجموعة مرتبة (tuple) تُعرَّف كالتالي:  
$$  
\Theta = \left( \text{id},\ \text{desc},\ \tau,\ \delta,\ n,\ \left\langle S_1, S_2, \ldots, S_m \right\rangle \right)  
$$  
**حيث**:  
- $\text{id} \in \mathbb{S}$: مُعرف فريد للمسار.  
  - *القيمة الافتراضية*: $\text{id} = \text{"untitled-track"}$.  
- $\text{desc} \in \mathbb{S}$: وصف مكون من جملة واحدة للمسار.  
  - *القيمة الافتراضية*: $\text{desc} = \text{"undescribed"}$.  
- $\tau \in \mathbb{T}$: مدة وحدة الزمن (انظر §١).  
  - *القيمة الافتراضية*: $\tau = 0.5\,s$.  
- $\delta \in \mathbb{T}$: مدة الحشو المُضافة قبل بدء المسار.  
  - *القيمة الافتراضية*: $\delta = 5$.  
  - *مثال*: $\delta = 1\,\text{يوم}$.  
- $n \in \mathbb{N}$: عدد وحدات الزمن في كل صندوق زمني.  
  - *القيمة الافتراضية*: $n = 8$ (مثال: مقطعين موسيقيين 4/4).  
- $\left\langle S_1, S_2, \ldots, S_m \right\rangle$: تسلسل أقسام مرتب (انظر §٣).  
  - *القيمة الافتراضية*: تسلسل فارغ $\left\langle \right\rangle$.  

---  

#### **٥. حالة المسار ($\Psi$)**  
حالة المسار $\Psi$ تمثل موقعًا زمنيًا محددًا داخل المسار، تُعرَّف بـ:  
$$  
\Psi = \left( i,\ j,\ k \right)  
$$  
**حيث**:  
- $i \in \mathbb{N}$: فهرس القسم الحالي في تسلسل المسار.  
  - $0 \leq i < |\Theta.\text{sections}|$  
- $j \in \mathbb{N}$: فهرس صندوق الزمن الحالي داخل القسم $S_i$.  
  - $0 \leq j < |S_i.\text{timeboxes}|$  
- $k \in \mathbb{N}$: فهرس وحدة الزمن الحالية داخل صندوق الزمن $T_{ij}$.  
  - $0 \leq k < T_{ij}.n$  

**الخصائص**:  
١. **الحالة الأولية**:  
   $$  
   \Psi_0 = (0,\ 0,\ 0)  
   $$  

٢. **انتقالات الحالة**:  
   - التقدم للأمام:  
     $$  
     \Psi_{t+1} = \begin{cases}  
     (i,\ j,\ k+1) & \text{إذا كان } k + 1 < T_{ij}.n \\  
     (i,\ j+1,\ 0) & \text{إذا كان } k + 1 = T_{ij}.n \text{ و } j + 1 < |S_i.\text{timeboxes}| \\  
     (i+1,\ 0,\ 0) & \text{إذا كان } k + 1 = T_{ij}.n \text{ و } j + 1 = |S_i.\text{timeboxes}| \\  
     \text{غير مُعرَّف} & \text{خلاف ذلك}  
     \end{cases}  
     $$  

٣. **الزمن المطلق**:  
   يمكن حساب الموقع الزمني المطلق لأي حالة كالتالي:  
   $$  
   t(\Psi) = \delta + \sum_{x=0}^{i-1} \text{Duration}(S_x) + \sum_{y=0}^{j-1} \text{Duration}(T_{iy}) + k \cdot \tau  
   $$  

٤. **قيود الحالة**:  
   $$  
   \forall \Psi = (i,\ j,\ k): \begin{cases}  
   0 \leq i < |\Theta.\text{sections}| \\  
   0 \leq j < |S_i.\text{timeboxes}| \\  
   0 \leq k < T_{ij}.n  
   \end{cases}  
   $$  

٥. **العمليات الأساسية**:  
   أ. **التقدم** ($\text{advance}: \Psi \to \Psi$):  
      $$  
      \text{advance}(\Psi) = \begin{cases}  
      (i,\ j,\ k+1) & \text{إذا كان } k + 1 < T_{ij}.n \\  
      (i,\ j+1,\ 0) & \text{إذا كان } k + 1 = T_{ij}.n \land j + 1 < |S_i.\text{timeboxes}| \\  
      (i+1,\ 0,\ 0) & \text{إذا كان } k + 1 = T_{ij}.n \land j + 1 = |S_i.\text{timeboxes}| \land i + 1 < |\Theta.\text{sections}| \\  
      \text{غير مُعرَّف} & \text{خلاف ذلك}  
      \end{cases}  
      $$  

   ب. **التراجع** ($\text{rewind}: \Psi \to \Psi$):  
      $$  
      \text{rewind}(\Psi) = \begin{cases}  
      (i,\ j,\ k-1) & \text{إذا كان } k > 0 \\  
      (i,\ j-1,\ T_{i,j-1}.n-1) & \text{إذا كان } k = 0 \land j > 0 \\  
      (i-1,\ |S_{i-1}.\text{timeboxes}|-1,\ T_{i-1,\text{last}}.n-1) & \text{إذا كان } k = 0 \land j = 0 \land i > 0 \\  
      \text{غير مُعرَّف} & \text{خلاف ذلك}  
      \end{cases}  
      $$  

   ج. **القفز إلى زمن** ($\text{seek}: \mathbb{R} \to \Psi$):  
      $$  
      \text{seek}(t) = \begin{cases}  
      (i,\ j,\ k) & \text{حيث } t(\Psi) \leq t < t(\text{advance}(\Psi)) \\  
      \text{غير مُعرَّف} & \text{إذا كان } t < 0 \text{ أو } t > \text{Duration}(\Theta)  
      \end{cases}  
      $$  

   د. **القفز إلى قسم** ($\text{jumpToSection}: \mathbb{N} \to \Psi$):  
      $$  
      \text{jumpToSection}(i) = \begin{cases}  
      (i,\ 0,\ 0) & \text{إذا كان } 0 \leq i < |\Theta.\text{sections}| \\  
      \text{غير مُعرَّف} & \text{خلاف ذلك}  
      \end{cases}  
      $$  

   هـ. **التحقق من الحالة** ($\text{isValid}: \Psi \to \{\text{true}, \text{false}\}$):  
      $$  
      \text{isValid}(\Psi) = \begin{cases}  
      \text{true} & \text{إذا كان } 0 \leq i < |\Theta.\text{sections}| \land \\  
      & 0 \leq j < |S_i.\text{timeboxes}| \land \\  
      & 0 \leq k < T_{ij}.n \\  
      \text{false} & \text{خلاف ذلك}  
      \end{cases}  
      $$  

   و. **مقارنة الحالات** ($\text{compare}: \Psi \times \Psi \to \{-1, 0, 1\}$):  
      $$  
      \text{compare}(\Psi_1, \Psi_2) = \begin{cases}  
      -1 & \text{إذا كان } t(\Psi_1) < t(\Psi_2) \\  
      0 & \text{إذا كان } t(\Psi_1) = t(\Psi_2) \\  
      1 & \text{إذا كان } t(\Psi_1) > t(\Psi_2)  
      \end{cases}  
      $$  

هذه العمليات تُشكِّل جبرًا كاملًا لإدارة حالة المسار، مما يُتيح:  
- التنقل للأمام والخلف  
- القفز المباشر إلى زمن محدد  
- التنقل بين الأقسام  
- التحقق من صحة الحالة ومقارنتها  
- تحكم زمني دقيق مُتماشٍ مع وحدة الزمن ($\tau$)  

---  

### **العلاقات الرياضية**  
١. **المدة الكلية للمسار**:  
   $$  
   \text{Duration}(\Theta) = \delta + \sum_{S \in \Theta} \sum_{T \in S} n_T \cdot \tau  
   $$  
   حيث $n_T$ هو عدد وحدات الزمن في صندوق الزمن $T$.  

٢. **التسلسل الهرمي**:  
   $$  
   \Theta \to \left\langle S_1, S_2, \ldots, S_m \right\rangle \quad \text{حيث} \quad S_i \to \left\langle T_{i1}, T_{i2}, \ldots, T_{ik} \right\rangle  
   $$  

٣. **قيود وحدة الزمن**:  
   - جميع العمليات الزمنية (تشغيل، إيقاف، إلخ) تتماشى مع دقة $\tau$.  
   - صناديق الزمن متصلة ولا تتداخل:  
   $$  
   \forall S \in \Theta,\ \forall T_j, T_{j+1} \in S: \quad t_{\text{start}}(T_{j+1}) = t_{\text{start}}(T_j) + n_j \cdot \tau  
   $$  

---  

### **أمثلة**  
- **وحدة الزمن**:  
  $\tau = 1\,\text{دقيقة} \implies \text{صندوق زمني بـ } n=5 \text{ له مدة } 5\,\text{دقائق}$.  
- **حشو المسار**:  
  $\delta = 7\,\text{أيام} \implies \text{يبدأ المسار بفترة تمهيدية مدتها أسبوع}$.  

---  

#### **٦. مشغل المسار ($\Pi$)**  
مشغل المسار $\Pi$ هو نظام ذو حالة يدير تشغيل المسار، ويُعرَّف كالتالي:  
$$  
\Pi = \left(\Theta,\ \Psi,\ \rho,\ \nu \right)  
$$  
**حيث**:  
- $\Theta$: المسار قيد التشغيل (انظر §٤).  
- $\Psi$: حالة المسار الحالية (انظر §٥).  
- $\rho \in \{\text{PLAYING}, \text{PAUSED}, \text{STOPPED}\}$: وضع التشغيل.  
- $\nu \in \mathbb{R}$: مُضاعف سرعة التشغيل.  
  - *القيمة الافتراضية*: $\nu = 1.0$.  
  - *مثال*: $\nu = 2.0$ للسرعة المزدوجة.  

**العمليات الأساسية**:  
أ. **التشغيل** ($\text{play}: \Pi \to \Pi$):  
   $$  
   \text{play}(\Pi) = \begin{cases}  
   (\Theta,\ \Psi,\ \text{PLAYING},\ \nu) & \text{إذا كان } \text{isValid}(\Psi) \\  
   (\Theta,\ \Psi_0,\ \text{PLAYING},\ \nu) & \text{إذا كانت } \Psi \text{ غير مُعرَّفة}  
   \end{cases}  
   $$  

ب. **الإيقاف المؤقت** ($\text{pause}: \Pi \to \Pi$):  
   $$  
   \text{pause}(\Pi) = (\Theta,\ \Psi,\ \text{PAUSED},\ \nu)  
   $$  

ج. **التوقف** ($\text{stop}: \Pi \to \Pi$):  
   $$  
   \text{stop}(\Pi) = (\Theta,\ \Psi_0,\ \text{STOPPED},\ \nu)  
   $$  

د. **ضبط السرعة** ($\text{setSpeed}: \Pi \times \mathbb{R} \to \Pi$):  
   $$  
   \text{setSpeed}(\Pi,\ \nu') = \begin{cases}  
   (\Theta,\ \Psi,\ \rho,\ \nu') & \text{إذا كان } \nu' > 0 \\  
   \Pi & \text{خلاف ذلك}  
   \end{cases}  
   $$  

هـ. **تحديث الحالة** ($\text{tick}: \Pi \times \Delta t \to \Pi$):  
   $$  
   \text{tick}(\Pi,\ \Delta t) = \begin{cases}  
   (\Theta,\ \text{advance}(\Psi),\ \rho,\ \nu) & \text{إذا كان } \rho = \text{PLAYING} \land \Delta t \geq \tau/\nu \\  
   \Pi & \text{خلاف ذلك}  
   \end{cases}  
   $$  

**انتقالات الحالة**:  
$$  
\begin{matrix}  
\text{STOPPED} & \xrightarrow{\text{play}} & \text{PLAYING} & \xrightarrow{\text{pause}} & \text{PAUSED} \\  
& & \downarrow\text{stop} & & \downarrow\text{stop} \\  
& & \text{STOPPED} & \xleftarrow{\text{stop}} & \text{PAUSED} \\  
& & & \xrightarrow{\text{play}} &  
\end{matrix}  
$$  

**الخصائص**:  
١. **تكميم الزمن**:  
   - جميع تحديثات الحالة تتماشى مع دقة $\tau$.  
   - عملية $\text{tick}$ تُحدِّث الحالة فقط عند $\Delta t \geq \tau/\nu$.  

٢. **الثوابت**:  
   $$  
   \forall \Pi: \text{isValid}(\Pi.\Psi),\ \Pi.\nu > 0,\ \Pi.\rho \in \{\text{PLAYING}, \text{PAUSED}, \text{STOPPED}\}  
   $$  

---  

#### **٧. الشاشة ($\Sigma$)**  
الشاشة $\Sigma$ هي واجهة بصرية تعكس الحالة الداخلية للمشغل:  
$$  
\Sigma = \left(R,\ \mathcal{C},\ \mathcal{I},\ \mathcal{H} \right)  
$$  
**حيث**:  
- $R = (w,\ h)$: دقة الشاشة.  
- $\mathcal{C}$: مكونات بصرية (أزرار، نصوص، إلخ).  
- $\mathcal{I}$: معالجات الإدخال.  
- $\mathcal{H}$: تسلسل هرمي للمكونات.  

**مثال لمشغل المسارات**:  
- **الخط الزمني**: يعرض موقع $\Psi$ الحالي.  
-