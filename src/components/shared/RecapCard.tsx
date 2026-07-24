import { forwardRef, useEffect } from 'react';
import type { Player, Role, PlacedReminder } from '../../types';
import { useGrimoireLayout } from '../../hooks/useGrimoireLayout';
import { displayRoleIds, deriveWinner } from '../../utils/discordRecap';
import { roleIconFallback } from '../../utils/roleIcon';
import CharacterToken from './CharacterToken';
import officialRoles from '../../official_roles.json';

const BOARD_WIDTH = 900;
const BOARD_HEIGHT = 680;
const CARD_PADDING = 40;
const REMINDER_SIZE_PCT = 26;
// The shared grimoire layout sizes tokens for the on-screen board, which leaves big gaps
// in the recap export; scale tokens (and their names) up to fill the space.
const RECAP_TOKEN_SCALE = 1.28;

const scalePx = (value: unknown, factor: number): string | undefined => {
  if (typeof value !== 'string') return value as string | undefined;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return value;
  const unit = value.replace(/[-0-9.]/g, '');
  return `${+(num * factor).toFixed(2)}${unit}`;
};

const DISPLAY_FONT = 'Georgia, "Times New Roman", serif';

interface RecapCardProps {
  players: Player[];
  rolesData: Role[];
  reminderTokens: PlacedReminder[];
  gameLog: string[];
  scriptName: string;
  dayNumber: number;
  timeOfDay: 'night' | 'day';
  date?: Date;
  isLightModeActive?: boolean;
  onLayoutReady?: () => void;
}

const THEME = {
  dark: {
    cardBg: 'linear-gradient(160deg, #16161a 0%, #0b0b0e 55%, #14090b 100%)',
    boardBg: '#141416',
    boardBorder: '#27272a',
    title: '#f4e4bc',
    subtitle: '#8b8b94',
    footer: '#5b5b66',
    nameAlive: '#1a1a1a',
    nameGlow: '0 1.5px 3px rgba(255,255,255,1), 0 0 5px rgba(255,255,255,1), 0 0 8px rgba(255,255,255,0.9)',
  },
  light: {
    cardBg: 'linear-gradient(160deg, #fdfaf2 0%, #f4ecdb 55%, #f7ede4 100%)',
    boardBg: '#fbf7ee',
    boardBorder: '#e7ddc7',
    title: '#7a5a24',
    subtitle: '#8a8172',
    footer: '#9a8f7d',
    nameAlive: '#1a1a1a',
    nameGlow: '0 1px 2px rgba(255,255,255,1), 0 0 4px rgba(255,255,255,0.95)',
  },
} as const;

const RecapCard = forwardRef<HTMLDivElement, RecapCardProps>(function RecapCard(
  { players, rolesData, reminderTokens, gameLog, scriptName, dayNumber, timeOfDay, date = new Date(), isLightModeActive = false, onLayoutReady },
  ref
) {
  const theme = isLightModeActive ? THEME.light : THEME.dark;
  const { boardRef, isMeasured, positions, btnStyle, nameStyle, getDynamicFontSize } = useGrimoireLayout(players.length);

  useEffect(() => {
    if (isMeasured) onLayoutReady?.();
  }, [isMeasured, onLayoutReady]);

  const scaledBtnStyle = {
    ...btnStyle,
    width: scalePx(btnStyle.width, RECAP_TOKEN_SCALE),
    height: scalePx(btnStyle.height, RECAP_TOKEN_SCALE),
  };

  const winner = deriveWinner(gameLog);
  const outcome = winner === 'good' ? '🌟 Good wins' : winner === 'evil' ? '😈 Evil wins' : null;
  const alive = players.filter(p => !p.isDead).length;
  const phase = `${timeOfDay === 'night' ? 'Night' : 'Day'} ${dayNumber}`;
  const when = date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div
      ref={ref}
      style={{
        width: BOARD_WIDTH + CARD_PADDING * 2,
        padding: CARD_PADDING,
        background: theme.cardBg,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 40, fontWeight: 700, color: theme.title, lineHeight: 1.1 }}>
            {scriptName}
          </div>
          <div style={{ fontSize: 17, color: theme.subtitle, marginTop: 8, letterSpacing: '0.02em' }}>
            {players.length} players · {alive} alive · ended {phase} · {when}
          </div>
        </div>
        {outcome && (
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
              background: winner === 'evil' ? '#8b0000' : '#2563eb',
              border: `2px solid ${winner === 'evil' ? '#ef4444' : '#60a5fa'}`,
              borderRadius: 10,
              padding: '10px 22px',
              whiteSpace: 'nowrap',
            }}
          >
            {outcome}
          </div>
        )}
      </div>

      <div
        ref={boardRef}
        style={{
          position: 'relative',
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          background: theme.boardBg,
          border: `1px solid ${theme.boardBorder}`,
          borderRadius: 40,
          containerType: 'size',
        }}
      >
        {players.map((p, index) => {
          const pos = positions[index] ?? { left: 50, top: 50 };
          const playerReminders = reminderTokens.filter(r => r.targetPlayerId === p.id);

          const dx = 50 - pos.left;
          const dy = 50 - pos.top;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const inwardDx = dist > 0 ? dx / dist : 0;
          const inwardDy = dist > 0 ? dy / dist : 0;

          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            >
              {playerReminders.map((reminder, ri) => {
                const n = playerReminders.length;
                const isLast = ri === n - 1;
                const arcN = n - 1;
                const theta = -Math.PI / 2 + (arcN > 1 ? (ri / (arcN - 1)) * Math.PI : 0);
                const arcRadius = 30;
                const rx = inwardDx * Math.cos(theta) - inwardDy * Math.sin(theta);
                const ry = inwardDx * Math.sin(theta) + inwardDy * Math.cos(theta);
                const left = isLast ? inwardDx * 70 : inwardDx * 70 + rx * arcRadius;
                const top = isLast ? inwardDy * 70 : inwardDy * 70 + ry * arcRadius;

                return (
                  <div
                    key={reminder.id}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${left.toFixed(1)}%)`,
                      top: `calc(50% + ${top.toFixed(1)}%)`,
                      transform: 'translate(-50%, -50%)',
                      width: `${REMINDER_SIZE_PCT}%`,
                      height: `${REMINDER_SIZE_PCT}%`,
                      zIndex: 55,
                      borderRadius: '9999px',
                      background: '#e5e7eb',
                      border: '2px solid #9ca3af',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={reminder.text}
                  >
                    <img
                      src={`/icons/${reminder.sourceCharId}.svg`}
                      alt={reminder.text}
                      style={{ width: '80%', height: '80%', objectFit: 'contain', opacity: 0.75 }}
                      onError={roleIconFallback(rolesData.find(r => r.id === reminder.sourceCharId))}
                    />
                  </div>
                );
              })}

              <div
                style={{
                  ...scaledBtnStyle,
                  position: 'relative',
                  borderRadius: '9999px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
                }}
              >
                {displayRoleIds(p).map((roleId, idx) => {
                  const role = roleId
                    ? rolesData.find(r => r.id === roleId) ?? (officialRoles as Role[]).find(r => r.id === roleId)
                    : null;
                  const defaultEvil = role ? role.team === 'minion' || role.team === 'demon' : false;
                  const isEvil = p.isEvil !== undefined
                    ? p.isEvil
                    : p.isTheLunatic
                      ? false
                      : p.isTheMarionette
                        ? true
                        : defaultEvil;

                  return (
                    <CharacterToken
                      key={idx}
                      role={role}
                      isEvil={isEvil}
                      isDead={p.isDead}
                      iconSizePct={80}
                      blankRing
                      idPrefix={`recap-${p.id}-${idx}`}
                      className="absolute inset-0"
                    />
                  );
                })}

                <span
                  style={{
                    ...nameStyle,
                    fontSize: scalePx(getDynamicFontSize(p.name), RECAP_TOKEN_SCALE),
                    position: 'relative',
                    zIndex: 20,
                    textAlign: 'center',
                    fontWeight: 700,
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    color: p.isDead ? '#d1d5db' : theme.nameAlive,
                    textShadow: p.isDead ? 'none' : theme.nameGlow,
                    wordBreak: 'break-word',
                  }}
                >
                  {p.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 18,
          fontSize: 14,
          color: theme.footer,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ fontFamily: DISPLAY_FONT, color: '#7a6028', fontWeight: 700 }}>Tiny Grimoire</span>
        <span>Blood on the Clocktower</span>
      </div>
    </div>
  );
});

export default RecapCard;
