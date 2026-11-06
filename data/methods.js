// ★ 唯一資料來源。格式與允許值說明見 CLAUDE.md 第 5 節。
window.CATEGORIES = ["純量控制", "向量控制", "直接控制", "調變技術", "預測控制", "無感測估測"];
window.MOTORS = ["感應馬達", "PMSM", "BLDC"];
window.LEVELS = ["低", "中", "高"];

window.METHODS = [
  {
    slug: "vf-control",
    abbr: "V/f",
    name: "V/f 純量控制",
    nameEn: "Constant V/f Scalar Control",
    category: "純量控制",
    motors: ["感應馬達"],
    summary: "維持電壓與頻率比值固定，使磁通近似不變的開迴路調速方法。",
    metrics: { dynamic: "低", lowSpeed: "低", complexity: "低", sensor: "不需要" },
    widget: "vf-curve"
  },
  {
    slug: "foc",
    abbr: "FOC",
    name: "磁場導向控制",
    nameEn: "Field-Oriented Control",
    category: "向量控制",
    motors: ["感應馬達", "PMSM"],
    summary: "把三相電流轉到旋轉座標，分別控制磁通與轉矩，像控制直流馬達一樣。",
    metrics: { dynamic: "高", lowSpeed: "高", complexity: "高", sensor: "需要角度（可無感測估測）" },
    widget: "park"
  },
  {
    slug: "dtc",
    abbr: "DTC",
    name: "直接轉矩控制",
    nameEn: "Direct Torque Control",
    category: "直接控制",
    motors: ["感應馬達", "PMSM"],
    summary: "用遲滯比較器與開關表直接選擇電壓向量，快速控制轉矩與定子磁通。",
    metrics: { dynamic: "高", lowSpeed: "中", complexity: "中", sensor: "不需要位置感測器" },
    widget: null
  },
  {
    slug: "svpwm",
    abbr: "SVPWM",
    name: "空間向量脈寬調變",
    nameEn: "Space Vector PWM",
    category: "調變技術",
    motors: ["感應馬達", "PMSM"],
    summary: "用相鄰兩個電壓向量與零向量合成命令電壓，直流電壓利用率比 SPWM 高。",
    metrics: null,
    widget: "svpwm-hex"
  }
];
