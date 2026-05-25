// 幸福计划 · 71 天完整课程目录数据
// 单一数据源：catalog / home / map / pathmap 都从这里读

const STAGES = [
  { id: 1, name: "觉察篇",  range: [1, 13],  color: "#C9854A", tint: "#F4E6D0", subtitle: "先把「幸福是什么」搞清楚" },
  { id: 2, name: "探索篇",  range: [14, 34], color: "#BFA158", tint: "#EFE7C8", subtitle: "幸福有好多种，别只盯着一种" },
  { id: 3, name: "练习篇",  range: [35, 61], color: "#8AA56E", tint: "#DDE5CC", subtitle: "动手把幸福练出来" },
  { id: 4, name: "内化篇",  range: [62, 71], color: "#7A8FA6", tint: "#CFD6E0", subtitle: "把幸福沉淀成习惯" }
];

const CURRICULUM = [
  { day: 1,  theme: "幸福不只是开心",   coreLine: "它更是觉得日子过得有滋味、有奔头" },
  { day: 2,  theme: "我们都追错了",     coreLine: "以为有钱、有名、身材好就幸福，结果常常不是" },
  { day: 3,  theme: "四成幸福靠自己",   coreLine: "大概四成握在你手里，剩下的别太较劲" },
  { day: 4,  theme: "好事为何不香了",   coreLine: "大脑会飞快地把惊喜变成「这没什么」" },
  { day: 5,  theme: "坏事为何更扎心",   coreLine: "大脑天生对坏消息更敏感" },
  { day: 6,  theme: "比较，快乐的小偷", coreLine: "一刷手机就觉得自己过得不行" },
  { day: 7,  theme: "你猜不准自己",     coreLine: "我们特别不擅长预测自己将来的心情" },
  { day: 8,  theme: "钱能买多少幸福",   coreLine: "有用，但远没你想的那么多" },
  { day: 9,  theme: "大脑一直在骗你",   coreLine: "把前面这些坑串起来看，就懂了" },
  { day: 10, theme: "给幸福打个分",     coreLine: "先摸清楚你现在站在哪" },
  { day: 11, theme: "幸福是练出来的",   coreLine: "它是肌肉，不是运气" },
  { day: 12, theme: "先看见你的情绪",   coreLine: "觉察的第一步，是承认它正在发生" },
  { day: 13, theme: "不必时刻都开心",   coreLine: "真正的幸福，允许你也有低落的时候" },
  { day: 14, theme: "幸福的五个来源",   coreLine: "情绪 / 投入 / 关系 / 意义 / 成就" },
  { day: 15, theme: "好情绪不止一种",   coreLine: "平静、感激、好奇、希望……都算" },
  { day: 16, theme: "好心情会滚雪球",   coreLine: "一点点积极，能攒出人生底气" },
  { day: 17, theme: "情绪也讲配比",     coreLine: "好的得比坏的多不少" },
  { day: 18, theme: "做到忘记时间",     coreLine: "「忘我」是幸福的高光时刻" },
  { day: 19, theme: "怎样更容易投入",   coreLine: "难度刚好、目标清楚、别被打断" },
  { day: 20, theme: "找到你的超能力",   coreLine: "每个人都有天生擅长的几样" },
  { day: 21, theme: "把擅长用起来",     coreLine: "用对地方，越用越带劲" },
  { day: 22, theme: "幸福藏在关系里",   coreLine: "哈佛 80 多年研究给的答案" },
  { day: 23, theme: "什么关系最养人",   coreLine: "不在多，在于有没有真的连上" },
  { day: 24, theme: "怎么接住好消息",   coreLine: "别人报喜时你怎么接话，能让关系升温也能降温" },
  { day: 25, theme: "给予比索取更甜",   coreLine: "帮别人，其实也是在喂养自己" },
  { day: 26, theme: "人需要被需要",     coreLine: "孤独有多伤人，归属就有多治愈" },
  { day: 27, theme: "做点更大的事",     coreLine: "觉得「这事有意义」，心里就踏实了" },
  { day: 28, theme: "意义感从哪来",     coreLine: "工作、家人、信念、创造" },
  { day: 29, theme: "你到底在乎啥",     coreLine: "把真正重要的东西摆到台面上" },
  { day: 30, theme: "做成的那种爽",     coreLine: "掌控感和成长本身就是幸福" },
  { day: 31, theme: "别为面子而活",     coreLine: "发自内心的目标比为了面子的更扛时间" },
  { day: 32, theme: "我的人生我做主",   coreLine: "越觉得「我能做主」，人越幸福" },
  { day: 33, theme: "被哇到的瞬间",     coreLine: "敬畏感特别治愈" },
  { day: 34, theme: "永远保持好奇",     coreLine: "对世界还有兴趣，是常年快乐的秘密" },
  { day: 35, theme: "允许自己难受",     coreLine: "情绪来了别硬推开，接住它" },
  { day: 36, theme: "感恩为何管用",     coreLine: "它会改变你大脑盯着看的东西" },
  { day: 37, theme: "每天记三件好事",   coreLine: "最简单也最有效的练习" },
  { day: 38, theme: "写一封感恩信",     coreLine: "能让人开心好几周的「重武器」" },
  { day: 39, theme: "慢下来品一品",     coreLine: "把当下的好，主动放大、延长" },
  { day: 40, theme: "怎么品才到位",     coreLine: "用五感感受、说出来、回头回味" },
  { day: 41, theme: "帮人就是帮己",     coreLine: "善意是会回弹的" },
  { day: 42, theme: "攒一天做好事",     coreLine: "比零零散散行善，幸福感更强" },
  { day: 43, theme: "凡事往好处想",     coreLine: "给自己留条路" },
  { day: 44, theme: "换个角度看坏事",   coreLine: "乐观的人解释得不一样" },
  { day: 45, theme: "把心拉回当下",     coreLine: "正念说白了就是好好待在此刻" },
  { day: 46, theme: "五分钟呼吸法",     coreLine: "随时能用的「情绪急救」" },
  { day: 47, theme: "动一动就变好",     coreLine: "运动是最便宜的「抗抑郁药」" },
  { day: 48, theme: "睡好才有好心情",   coreLine: "睡眠是情绪的地基" },
  { day: 49, theme: "多去户外走走",     coreLine: "大自然真的能修复人" },
  { day: 50, theme: "别再钻牛角尖",     coreLine: "反复琢磨只会越想越糟" },
  { day: 51, theme: "试着放下怨气",     coreLine: "原谅，先松开的是你自己" },
  { day: 52, theme: "对自己好一点",     coreLine: "别人犯错你能体谅，对自己却往死里骂" },
  { day: 53, theme: "摔倒了再爬起",     coreLine: "抗挫力是可以练出来的" },
  { day: 54, theme: "钱怎么花更幸福",   coreLine: "买体验、为别人花，比买东西更值" },
  { day: 55, theme: "别让手机绑架你",   coreLine: "重新安排你和屏幕的关系" },
  { day: 56, theme: "学会说不",         coreLine: "守住边界是一种自我保护" },
  { day: 57, theme: "吵架了怎么和好",   coreLine: "出问题不可怕，不会修才可怕" },
  { day: 58, theme: "别再追求完美",     coreLine: "差不多就好，反而活得更舒展" },
  { day: 59, theme: "做真实的自己",     coreLine: "装久了会累，做自己才轻松" },
  { day: 60, theme: "让上班没那么累",   coreLine: "给手里的活儿找点意义和掌控感" },
  { day: 61, theme: "把日子过慢点",     coreLine: "时间比钱更稀缺，别老在赶" },
  { day: 62, theme: "写下来的力量",     coreLine: "记录本身就是一种幸福练习" },
  { day: 63, theme: "幸福日记怎么写",   coreLine: "一个能长期坚持的简单模板" },
  { day: 64, theme: "给情绪起个名",     coreLine: "说得清感受，才管得住它" },
  { day: 65, theme: "找到适合你的",     coreLine: "别人有用的不一定适合你" },
  { day: 66, theme: "让幸福成习惯",     coreLine: "让幸福事像刷牙一样自动" },
  { day: 67, theme: "换着花样来练",     coreLine: "别把一个练习做腻" },
  { day: 68, theme: "拉个人一起练",     coreLine: "有人陪，更容易坚持" },
  { day: 69, theme: "把幸福当回事",     coreLine: "真心想要，才会真的去做" },
  { day: 70, theme: "定制你的方案",     coreLine: "用这两个多月学的攒出一套" },
  { day: 71, theme: "日子是有限的",     coreLine: "想明白这一点，你会更舍得对自己好" }
];

// Day 0 入门：跟 4 阶段平行，单独显示
const ONBOARDING_DAY = {
  day: 0,
  theme: "把今天的自己留个底",
  coreLine: "你今天写下的话，71 天后会有人陪你回头看",
  stage: { id: 0, name: "入门", color: "#9B7B5A", tint: "#F0E6D6", subtitle: "在 71 天开始之前，先认识自己" }
};

// 当前已上线（有 day*.json）的天数。Day 0 是入门必经
const AVAILABLE_DAYS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

function getStageForDay(day) {
  if (day === 0) return ONBOARDING_DAY.stage;
  return STAGES.find(s => day >= s.range[0] && day <= s.range[1]);
}

function getDayMeta(day) {
  if (day === 0) return ONBOARDING_DAY;
  const item = CURRICULUM.find(d => d.day === day);
  if (!item) return null;
  return { ...item, stage: getStageForDay(day) };
}

// 暴露给页面
window.XINGFU = { STAGES, CURRICULUM, ONBOARDING_DAY, AVAILABLE_DAYS, getStageForDay, getDayMeta };
