import React from 'react'
import { Shield, PenTool, Moon, Sparkles, Crown, BookOpen, FileText, Flower2, Music, Star } from 'lucide-react'

const STYLES = [
  { id: 'hupu',     label: '虎扑体',   Icon: Shield,    desc: '老哥神评，直爽幽默' },
  { id: 'luxun',    label: '鲁迅体',   Icon: PenTool,   desc: '沉郁顿挫，入木三分' },
  { id: 'bingxin',  label: '冰心体',   Icon: Moon,      desc: '温婉细腻，意境悠远' },
  { id: 'daiyu',    label: '黛玉体',     Icon: Flower2,   desc: '多愁善感，清冷细腻' },
  { id: 'zhangailing', label: '张爱玲体', Icon: Sparkles, desc: '清冷洞察，细节入心' },
  { id: 'wangxiaobo', label: '王小波体', Icon: PenTool,  desc: '理性幽默，轻微反讽' },
  { id: 'manbo',    label: '曼波体',     Icon: Music,     desc: '节奏感强，热梗口吻' },
  { id: 'erciyuan', label: '二刺螈体',   Icon: Star,      desc: '轻中二感，热血吐槽' },
  { id: 'zhen',     label: '甄嬛体',     Icon: Crown,     desc: '对不起，臣妾觉得此菜…' },
  { id: 'sushi',    label: '苏轼体',     Icon: BookOpen,  desc: '大江东去，食者无畏' },
  { id: 'luban',    label: '鲁班手札',   Icon: FileText,  desc: '工程笔记，工艺评估' },
  { id: 'manual',   label: '说明书体',   Icon: FileText,  desc: '产品规格，严谨刻板' },
]

/** 文豪文体选择器 */
export default function StyleRewriter({ selected, onSelect }) {
  return (
    <div>
      <p className="text-xs text-orange-400/60 mb-2 font-mono inline-flex items-center gap-1">
        <Sparkles size={12} /> 选择个性风格
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {STYLES.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`
              text-left p-2.5 rounded-lg transition-all duration-300 text-xs
              ${selected === s.id
                ? 'bg-amber-500/15 border border-amber-400/60 shadow-[0_0_10px_rgba(245,166,35,0.2)]'
                : 'bg-orange-500/04 border border-orange-400/15 hover:border-orange-400/30'
              }
            `}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <s.Icon size={13} className={selected === s.id ? 'text-amber-300' : 'text-orange-400/50'} />
              <span className={`font-bold ${selected === s.id ? 'text-amber-300' : 'text-orange-400/70'}`}>
                {s.label}
              </span>
            </div>
            <p className={`text-[10px] leading-tight ${selected === s.id ? 'text-amber-200/60' : 'text-orange-400/40'}`}>
              {s.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
