/** 北京交通大学 · 燕园配置 */

const COUNSELING = {
  id: 'psych_center',
  name: '心理素质教育中心',
  type: 'counseling',
  poiKeywords: [
    '北京交通大学心理素质教育中心',
    '心理素质教育中心',
    '学生心理中心',
    '北京交通大学第二教学楼',
    '第二教学楼',
  ],
  lng: 116.340592,
  lat: 39.952362,
  accentColor: '#6ee7b7',
  info: {
    org: '北京交通大学心理素质教育中心',
    building: '主校区第二教学楼',
    audience: '面向本校全日制本科生、研究生及教职工',
    service: '提供免费心理咨询服务；全日制在校生可通过学校预约系统进行一对一咨询',
    address: '北京市海淀区上园村3号 北京交通大学主校区第二教学楼',
    studentPhone: '010-51685166',
    studentPhoneLabel: '学生心理中心（专兼职咨询师接听）',
    staffPhone: '010-51685882',
    staffPhoneLabel: '教职工关爱工作室',
    hours: '请通过学校官方预约系统查询可预约时段',
  },
  tags: ['第二教学楼', '免费咨询', '预约制'],
}

export default {
  id: 'bjtu',
  name: '北京交通大学',
  shortName: '北交大',
  englishName: 'Beijing Jiaotong University',
  englishShort: 'BJTU',
  siteUrl: 'https://bjtu.app',
  mapCanvasText: 'BJTU',
  heritageLabel: '北交渊源',
  weatherLabel: '海淀',

  map: {
    center: [116.3408, 39.9512],
    zoom: 17.2,
    pitch: 55,
    rotation: -10,
    radius: 800,
  },

  assets: {
    badge: '/bjtu-badge.png',
    badgeWhite: '/bjtu-badge-white.png',
    wordmark: '/bjtu-wordmark.png',
    wordmarkLight: '/bjtu-wordmark-light.png',
  },

  shareMeta: {
    title: '量子烟火 · 北交大智慧校园双模态智能体',
    shortTitle: '量子烟火 · Quantum Fireworks',
    description:
      '北京交通大学智慧校园 Web 应用：里世界倾诉情绪、种植量子植物；表世界吐槽食堂、文豪改写、五维战力雷达。3D 校园地图 + Coze AI 双模态体验。',
    keywords: '北京交通大学,北交大,量子烟火,智慧校园,AI,里世界,表世界',
  },

  bootPhases: {
    map: '加载北交大 3D 校园地图…',
    calibrate: '校准思源楼 · 图书馆 · 心理中心坐标…',
  },

  innerLocations: [
    { id: 'siyuan', name: '思源楼', gardenAlias: null },
    { id: 'library', name: '图书馆', gardenAlias: null },
    { id: 'lab', name: '实验室', gardenAlias: null },
    { id: 'field', name: '操场', gardenAlias: null },
    { id: 'dorm', name: '宿舍', gardenAlias: null },
    { id: 'garden', name: '红果园', gardenAlias: 'canteen_hgyfood' },
  ],

  canteens: [
    { id: 'canteen_xuehuo', name: '学活食堂', desc: '校区中部，品种丰富' },
    { id: 'canteen_hgyfood', name: '红果园餐厅', desc: '红果园区，环境舒适' },
    { id: 'canteen_4', name: '四食堂', desc: '嘉园附近，学生公寓旁' },
  ],

  emotionLocationMap: {
    思源楼: '思源楼的灯光依然亮着，它见证过无数个深夜奋战的背影。',
    图书馆: '图书馆的书脊沉默地排列着，它们知道你的困惑，因为它们曾被无数人翻阅。',
    操场: '操场上的风轻轻吹过，它带走过无数心事，也带来过无数释然。',
    红果园: '红果园的老树静静伫立，它拥抱过太多情绪，此刻也在这里陪着你。',
    嘉园: '嘉园的走廊深夜依然亮着灯，每扇门后都是一个不同的宇宙，你也是。',
  },

  landmarks: [
    {
      id: 'canteen_xuehuo', name: '学活食堂', type: 'canteen',
      poiKeywords: ['北京交通大学学活食堂', '学活食堂', '交大学活'],
      lng: 116.338075, lat: 39.950509,
    },
    {
      id: 'canteen_hgyfood', name: '红果园餐厅', type: 'canteen',
      poiKeywords: ['红果园餐厅', '北京交通大学红果园餐厅'],
      lng: 116.344300, lat: 39.950798,
    },
    {
      id: 'canteen_4', name: '四食堂', type: 'canteen',
      poiKeywords: ['学生四食堂', '北京交通大学四食堂'],
      lng: 116.344124, lat: 39.949764,
    },
    {
      id: 'siyuan', name: '思源楼', type: 'academic',
      poiKeywords: ['思源楼', '北京交通大学思源楼'],
      lng: 116.340860, lat: 39.951549,
    },
    {
      id: 'library', name: '图书馆', type: 'academic',
      poiKeywords: ['北京交通大学图书馆', '交大图书馆'],
      lng: 116.343430, lat: 39.952100,
    },
    {
      id: 'lab', name: '计算机学院', type: 'academic',
      poiKeywords: ['北京交通大学计算机学院', '计算机科学与技术学院'],
      lng: 116.342295, lat: 39.950188,
    },
    {
      id: 'field', name: '西操场', type: 'outdoor',
      poiKeywords: ['北京交通大学体育场', '交大西操场'],
      lng: 116.337853, lat: 39.952441,
    },
    {
      id: 'dorm', name: '嘉园宿舍区', type: 'dorm',
      poiKeywords: ['北京交通大学嘉园', '嘉园学生公寓'],
      lng: 116.342621, lat: 39.948929,
    },
    {
      id: 'statue_mao', name: '毛主席像', type: 'heritage',
      poiKeywords: ['毛主席像 北京交通大学', '北交大 毛主席像'],
      lng: 116.342100, lat: 39.950509,
      story: {
        title: '校园精神地标',
        summary: '作为校园精神地标之一，毛主席像见证了一代代交大学子在此求知与成长。',
        relation: '北交大源自交通强校传统，长期服务国家交通建设与工程人才培养。',
        legacy: '象征面向国家需求、工程报国的使命感。',
      },
      tags: ['校史精神', '工程报国', '校园记忆'],
    },
    {
      id: 'statue_zhan', name: '詹天佑像', type: 'heritage',
      poiKeywords: ['詹天佑像 北京交通大学', '北交大 詹天佑像'],
      lng: 116.341002, lat: 39.950167,
      story: {
        title: '中国铁路先驱',
        summary: '詹天佑主持修建京张铁路，是中国铁路工程的开拓者。',
        relation: '北交大以交通为学科底色，铁路与轨道交通人才培养与其精神一脉相承。',
        legacy: '代表自立自强的工程创新精神。',
      },
      tags: ['铁路先驱', '创新精神', '学科传承'],
    },
    {
      id: 'statue_mao_yisheng', name: '茅以升像', type: 'heritage',
      poiKeywords: ['茅以升像 北京交通大学', '北交大 茅以升像'],
      lng: 116.343187, lat: 39.951818,
      story: {
        title: '中国桥梁工程奠基人',
        summary: '茅以升主持修建钱塘江大桥，是中国桥梁工程的重要奠基者。',
        relation: '北交大交通与土木相关学科注重工程实践，与其“学以致用”理念相契合。',
        legacy: '象征严谨求实与工程创新。',
      },
      tags: ['严谨求实', '学以致用'],
    },
    COUNSELING,
  ],
}
