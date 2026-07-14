/** 北京大学 · 燕园配置（坐标需坐标拾取工具微调） */

const COUNSELING = {
  id: 'psych_center',
  name: '学生心理健康教育与咨询中心',
  type: 'counseling',
  poiKeywords: [
    '北京大学学生心理健康教育与咨询中心',
    '北京大学心理中心',
    '新太阳学生中心',
  ],
  lng: 116.30682,
  lat: 39.99418,
  accentColor: '#6ee7b7',
  info: {
    org: '北京大学学生心理健康教育与咨询中心',
    building: '新太阳学生中心',
    audience: '面向本校全日制本科生、研究生及教职工',
    service: '提供免费心理咨询服务；在校生可通过网上预约系统预约咨询',
    address: '北京市海淀区颐和园路5号 北京大学燕园 新太阳学生中心',
    studentPhone: '010-62760852',
    studentPhoneLabel: '学生心理健康教育与咨询中心',
    staffPhone: '010-62760852',
    staffPhoneLabel: '预约与咨询专线',
    hours: '请通过学校官方预约系统查询可预约时段',
  },
  tags: ['新太阳', '免费咨询', '预约制'],
}

export default {
  id: 'pku',
  name: '北京大学',
  shortName: '北大',
  englishName: 'Peking University',
  englishShort: 'PKU',
  siteUrl: 'https://pku.app',
  mapCanvasText: 'PKU',
  heritageLabel: '燕园渊源',
  weatherLabel: '燕园',

  map: {
    center: [116.3103, 39.9928],
    zoom: 17.0,
    pitch: 55,
    rotation: -8,
    radius: 1200,
  },

  assets: {
    badge: '/campus/pku/badge.svg',
    badgeWhite: '/campus/pku/badge-white.svg',
    wordmark: '/campus/pku/wordmark.svg',
    wordmarkLight: '/campus/pku/wordmark-light.svg',
  },

  shareMeta: {
    title: '量子烟火 · 北大燕园智慧校园双模态智能体',
    shortTitle: '量子烟火 · Quantum Fireworks',
    description:
      '北京大学燕园智慧校园 Web 应用：里世界倾诉情绪、种植量子植物；表世界吐槽食堂、文豪改写、五维战力雷达。3D 校园地图 + Coze AI 双模态体验。',
    keywords: '北京大学,北大,燕园,量子烟火,智慧校园,AI,里世界,表世界',
  },

  bootPhases: {
    map: '加载北大燕园 3D 校园地图…',
    calibrate: '校准未名湖 · 博雅塔 · 图书馆坐标…',
  },

  innerLocations: [
    { id: 'boya', name: '博雅塔', gardenAlias: null },
    { id: 'library', name: '图书馆', gardenAlias: null },
    { id: 'lab', name: '王克桢楼', gardenAlias: null },
    { id: 'field', name: '五四体育场', gardenAlias: null },
    { id: 'dorm', name: '宿舍区', gardenAlias: null },
    { id: 'garden', name: '未名湖', gardenAlias: 'weiming_lake' },
  ],

  canteens: [
    { id: 'canteen_nongyuan', name: '农园食堂', desc: '燕园东侧，人气食堂' },
    { id: 'canteen_yannan', name: '燕南食堂', desc: '燕南园附近，日常就餐' },
    { id: 'canteen_xuewu', name: '学五食堂', desc: '学五区域，品种丰富' },
  ],

  emotionLocationMap: {
    博雅塔: '博雅塔的轮廓在夜色里格外安静，它提醒人们：学问之外，也需要抬头看看月亮。',
    图书馆: '图书馆的书架沉默排列，它们见证过无数燕园学子在此寻找答案。',
    五四体育场: '五四体育场的跑道延伸向远方，奔跑时，许多心事会被风带走。',
    未名湖: '未名湖的波纹轻轻荡开，它听过太多深夜里的低语，也见过太多释然。',
    宿舍区: '宿舍区的灯光星星点点，每扇窗后都是一个正在生长的故事。',
  },

  landmarks: [
    {
      id: 'canteen_nongyuan', name: '农园食堂', type: 'canteen',
      poiKeywords: ['北京大学农园食堂', '农园食堂'],
      lng: 116.31203, lat: 39.99411,
    },
    {
      id: 'canteen_yannan', name: '燕南食堂', type: 'canteen',
      poiKeywords: ['北京大学燕南食堂', '燕南食堂'],
      lng: 116.30786, lat: 39.98961,
    },
    {
      id: 'canteen_xuewu', name: '学五食堂', type: 'canteen',
      poiKeywords: ['北京大学学五食堂', '学五食堂'],
      lng: 116.30542, lat: 39.99428,
    },
    {
      id: 'boya', name: '博雅塔', type: 'academic',
      poiKeywords: ['北京大学博雅塔', '博雅塔'],
      lng: 116.30877, lat: 39.99243,
    },
    {
      id: 'library', name: '图书馆', type: 'academic',
      poiKeywords: ['北京大学图书馆', '北大图书馆'],
      lng: 116.30972, lat: 39.99111,
    },
    {
      id: 'lab', name: '王克桢楼', type: 'academic',
      poiKeywords: ['北京大学王克桢楼', '王克桢楼'],
      lng: 116.30820, lat: 39.99085,
    },
    {
      id: 'field', name: '五四体育场', type: 'outdoor',
      poiKeywords: ['北京大学五四体育场', '五四体育场'],
      lng: 116.30620, lat: 39.99095,
    },
    {
      id: 'dorm', name: '33楼宿舍区', type: 'dorm',
      poiKeywords: ['北京大学33楼', '33楼宿舍'],
      lng: 116.31150, lat: 39.98980,
    },
    {
      id: 'weiming_lake', name: '未名湖', type: 'outdoor',
      poiKeywords: ['北京大学未名湖', '未名湖'],
      lng: 116.30740, lat: 39.99270,
    },
    {
      id: 'lecture_hall', name: '百周年纪念讲堂', type: 'academic',
      poiKeywords: ['北京大学百周年纪念讲堂', '百讲'],
      lng: 116.31056, lat: 39.99269,
    },
    {
      id: 'statue_cai', name: '蔡元培像', type: 'heritage',
      poiKeywords: ['北京大学蔡元培像', '蔡元培像'],
      lng: 116.30895, lat: 39.99305,
      story: {
        title: '“思想自由，兼容并包”',
        summary: '蔡元培先生任北大校长期间，倡导思想自由与兼容并包，奠定了现代北大精神底色。',
        relation: '燕园的人文气质与学术传统，与蔡元培先生的教育理念一脉相承。',
        legacy: '象征开放包容、独立求索的学术精神。',
      },
      tags: ['北大精神', '兼容并包', '燕园记忆'],
    },
    {
      id: 'heritage_boya', name: '博雅塔', type: 'heritage',
      poiKeywords: ['博雅塔 燕园', '北京大学博雅塔'],
      lng: 116.30877, lat: 39.99243,
      story: {
        title: '燕园地标',
        summary: '博雅塔矗立于未名湖畔，是燕园最具辨识度的建筑之一，也是北大人心中的精神坐标。',
        relation: '它与未名湖、图书馆共同构成燕园经典景观，见证了一代又一代北大学子。',
        legacy: '象征沉潜学问、仰望星空的燕园气质。',
      },
      tags: ['燕园地标', '未名湖畔', '校园记忆'],
    },
    {
      id: 'heritage_weiming', name: '未名湖', type: 'heritage',
      poiKeywords: ['未名湖', '北京大学未名湖'],
      lng: 116.30740, lat: 39.99270,
      story: {
        title: '一湖燕园梦',
        summary: '未名湖与博雅塔相映成趣，是燕园最具诗性的空间，承载无数青春与思考。',
        relation: '从湖畔晨读到深夜漫步，未名湖是北大人共同的情感坐标。',
        legacy: '象征燕园的诗意、包容与永恒。',
      },
      tags: ['未名湖', '燕园诗意', '青春记忆'],
    },
    COUNSELING,
  ],
}
