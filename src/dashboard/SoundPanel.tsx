import { Volume2 } from 'lucide-react';
import { useState } from 'react';
import { Field, Section, Segmented, Toggle } from '../components/ui';
import { useLocale, useT } from '../i18n';
import { useDeck } from '../store/deck';
import { playSound, requestNotifyPermission, speak, unlockAudio } from '../lib/audio';
import type { SoundKind, SoundSettings } from '../types';

export function SoundPanel() {
  const t = useT();
  const locale = useLocale();
  const s = useDeck((st) => st.config.sound);
  const update = useDeck((st) => st.update);
  const set = (fn: (d: SoundSettings) => void) => update((c) => fn(c.sound));
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  return (
    <>
      <Section title={t('snd.sound', 'Sound')}>
        <Toggle checked={s.enabled} onChange={(v) => set((d) => void (d.enabled = v))} label={t('snd.enable', 'Play sounds')} />
        <Segmented<SoundKind>
          value={s.kind}
          onChange={(v) => {
            set((d) => void (d.kind = v));
            unlockAudio();
            playSound(v, 'end', s.volume);
          }}
          options={[
            { value: 'chime', label: t('snd.chime', 'Chime') },
            { value: 'bell', label: t('snd.bell', 'Bell') },
            { value: 'gong', label: t('snd.gong', 'Gong') },
            { value: 'beep', label: t('snd.beep', 'Beep') },
          ]}
        />
        <Field label={`${t('snd.volume', 'Volume')} · ${Math.round(s.volume * 100)}%`}>
          <input type="range" className="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => set((d) => void (d.volume = parseFloat(e.target.value)))} />
        </Field>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            unlockAudio();
            playSound(s.kind, 'end', s.volume);
          }}
        >
          <Volume2 size={16} /> {t('snd.test', 'Test sound')}
        </button>
      </Section>
      <Section title={t('snd.voice', 'Voice & notifications')}>
        <Toggle
          checked={s.speech}
          onChange={(v) => {
            set((d) => void (d.speech = v));
            if (v) speak(t('sig.oneMinute', 'One minute remaining'), locale, s.volume);
          }}
          label={t('snd.speech', 'Spoken announcements')}
          hint={t('snd.speechHint', '“One minute remaining”, phase names, exam milestones')}
        />
        <Toggle
          checked={s.notify}
          onChange={async (v) => {
            set((d) => void (d.notify = v));
            if (v) setPerm(await requestNotifyPermission());
          }}
          label={t('snd.notify', 'System notifications')}
          hint={perm === 'denied' ? t('snd.denied', 'Blocked in browser settings') : perm === 'unsupported' ? t('snd.unsupported', 'Not supported in this browser') : t('snd.notifyHint', 'When a timer ends while this tab is in the background')}
        />
      </Section>
    </>
  );
}
