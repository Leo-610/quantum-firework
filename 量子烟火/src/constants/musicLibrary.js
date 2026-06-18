/** 站内 BGM — 音频放 public/music/ 并在此注册 */

export const MUSIC_LIBRARY = [
  {
    id: 'em-ambient-01',
    title: 'Campus 氛围',
    artist: '量子烟火曲库',
    src: '/music/em-ambient-01.mp3',
    mood: '氛围',
  },
]

export function getMusicTrack(id) {
  return MUSIC_LIBRARY.find(t => t.id === id)
}

export const DEFAULT_MUSIC_TRACK_ID = MUSIC_LIBRARY[0]?.id ?? ''
