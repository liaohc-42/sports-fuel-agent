/* ============================================================
 * 运动数据库 exercise.js
 * MET：代谢当量（Metabolic Equivalent of Task）
 * 热量公式：kcal = MET × 3.5 × 体重(kg) / 200 × 分钟
 * 强度参考文案：符合「配餐」栏目需求（跑步轻松=配速>7'00" 等）
 * ============================================================ */
(function () {
  'use strict';

  const EXERCISES = [
    {
      id: 'run', name: '跑步', icon: '🏃', category: '有氧',
      children: null,
      intensities: [
        { id: 'easy',  label: '轻松', met: 8,    note: '配速 > 7\'00"  (约8km/h，能边跑边聊天)' },
        { id: 'normal',label: '正常', met: 10,   note: '配速 5\'00" ~ 7\'00"  (约10km/h)' },
        { id: 'fast',  label: '较快', met: 12.5, note: '配速 4\'00" ~ 5\'00"  (约12km/h)' },
        { id: 'sprint',label: '冲刺', met: 15,   note: '配速 < 4\'00"  (间歇/冲刺)' },
      ]
    },
    {
      id: 'hike', name: '徒步', icon: '🥾', category: '有氧',
      children: [
        { id: 'walk',  name: '散步', icon: '🚶', met: 3,  note: '慢走 约3-4km/h' },
        { id: 'fastwalk', name: '快走', icon: '🚶‍♀️', met: 5, note: '快走 约5-6km/h' },
        { id: 'climb', name: '登山', icon: '⛰️', met: 7, note: '爬坡/负重 约7km/h' },
      ],
      intensities: [
        { id: 'easy',  label: '轻松', met: 3.5, note: '平地缓行，呼吸平稳' },
        { id: 'normal',label: '正常', met: 5,   note: '快步走，微喘可说话' },
        { id: 'fast',  label: '较快', met: 7,   note: '爬坡/登山，明显出汗' },
      ]
    },
    {
      id: 'swim', name: '游泳', icon: '🏊', category: '有氧',
      children: [
        { id: 'breast', name: '蛙泳', icon: '🐸', met: 6,  note: '休闲蛙泳' },
        { id: 'free',   name: '自由泳', icon: '🏊', met: 8, note: '中等强度自由泳' },
        { id: 'back',   name: '仰泳', icon: '🛟', met: 7,  note: '中等强度仰泳' },
        { id: 'fly',    name: '蝶泳', icon: '🦋', met: 11, note: '蝶泳(高消耗)' },
      ],
      intensities: [
        { id: 'easy',  label: '轻松', met: 6,  note: '慢速放松游，可长时间维持' },
        { id: 'normal',label: '正常', met: 8,  note: '匀速巡航，呼吸有节奏' },
        { id: 'fast',  label: '较快', met: 11, note: '竞速/蝶泳，短间歇' },
      ]
    },
    {
      id: 'strength', name: '力量', icon: '🏋️', category: '无氧',
      children: [
        { id: 'upper', name: '上肢', icon: '💪', met: 3.5, note: '俯卧撑/引体/推举' },
        { id: 'lower', name: '下肢', icon: '🦵', met: 5,   note: '深蹲/弓步/臀桥' },
        { id: 'core',  name: '核心', icon: '🧘', met: 3.8, note: '平板支撑/卷腹/死虫' },
        { id: 'full',  name: '全身', icon: '🏋️', met: 6,  note: '杠铃/哑铃综合力量' },
      ],
      intensities: [
        { id: 'easy',  label: '轻松', met: 3,  note: '自重/小重量，多次数轻松完成' },
        { id: 'normal',label: '正常', met: 5,  note: '中等负荷，组末略吃力' },
        { id: 'fast',  label: '高强度', met: 6.5, note: '大重量接近力竭/循环训练' },
      ]
    },
    {
      id: 'ball', name: '球类', icon: '⚽', category: '有氧+无氧',
      children: [
        { id: 'basket', name: '篮球', icon: '🏀', met: 6.5, note: '半场对抗 6.5 / 全场 8' },
        { id: 'foot',   name: '足球', icon: '⚽', met: 7,   note: '对抗 7 / 比赛 10' },
        { id: 'badm',   name: '羽毛球', icon: '🏸', met: 5.5, note: '休闲 5.5 / 竞技 7' },
        { id: 'table',  name: '乒乓球', icon: '🏓', met: 4, note: '中等对抗' },
        { id: 'volley', name: '排球', icon: '🏐', met: 4,   note: '休闲 4 / 竞技 8' },
        { id: 'tennis', name: '网球', icon: '🎾', met: 7,   note: '中等对抗' },
      ],
      intensities: [
        { id: 'easy',  label: '轻松', met: 4.5, note: '休闲娱乐，节奏慢' },
        { id: 'normal',label: '正常', met: 6.5, note: '对抗/练习，中等强度' },
        { id: 'fast',  label: '高强度', met: 9, note: '比赛/全力对抗' },
      ]
    },
    {
      id: 'bike', name: '骑行', icon: '🚴', category: '有氧',
      children: null,
      intensities: [
        { id: 'easy',  label: '轻松', met: 4, note: '休闲 <16km/h' },
        { id: 'normal',label: '正常', met: 6, note: '16-19km/h' },
        { id: 'fast',  label: '较快', met: 8, note: '20km/h 以上' },
      ]
    },
    {
      id: 'jump', name: '跳绳', icon: '🪢', category: '有氧',
      children: null,
      intensities: [
        { id: 'easy',  label: '慢速', met: 8,  note: '约 <100次/分钟' },
        { id: 'normal',label: '中速', met: 10, note: '约 100-120次/分钟' },
        { id: 'fast',  label: '快速', met: 12, note: '约 >120次/分钟' },
      ]
    },
    {
      id: 'yoga', name: '瑜伽/拉伸', icon: '🧘‍♀️', category: '柔韧',
      children: null,
      intensities: [
        { id: 'easy',  label: '舒缓', met: 2.5, note: '哈他/拉伸放松' },
        { id: 'normal',label: '常规', met: 3.3, note: '流瑜伽/平衡' },
        { id: 'fast',  label: '进阶', met: 4,   note: '力量瑜伽/高温' },
      ]
    },
  ];

  // 计算运动消耗
  function calcKcal(met, weightKg, minutes) {
    const w = weightKg || 60;
    return Math.round(met * 3.5 * w / 200 * minutes);
  }

  // 基础代谢 BMR（Mifflin-St Jeor）
  function calcBMR(gender, weightKg, heightCm, age) {
    const w = weightKg || 60, h = heightCm || 170, a = age || 20;
    const base = 10 * w + 6.25 * h - 5 * a;
    return Math.round(gender === 'female' ? base - 161 : base + 5);
  }

  // 目标每日摄入（kcal）
  function targetIntake(goal, bmr, exerciseKcal) {
    const active = Math.round(bmr * 1.3); // 学生日常活动
    const maintain = active + exerciseKcal;
    if (goal === '增肌') return { maintain, target: maintain + 300 };
    if (goal === '减脂') return { maintain, target: Math.max(1200, maintain - 400) };
    return { maintain, target: maintain };
  }

  window.EXERCISE = {
    EXERCISES,
    calcKcal,
    calcBMR,
    targetIntake,
    findByChildId(childId) {
      for (const e of EXERCISES) {
        if (e.children) {
          const c = e.children.find(x => x.id === childId);
          if (c) return { exercise: e, child: c };
        }
      }
      const e = EXERCISES.find(x => x.id === childId);
      return e ? { exercise: e, child: e } : null;
    }
  };
})();
