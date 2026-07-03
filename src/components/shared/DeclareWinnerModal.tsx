import { cn } from '../../utils/cn';

interface DeclareWinnerModalProps {
  team: 'good' | 'evil';
  remotePlayerCount: number;
  onDisconnect: () => void;
  onResetKeepConnected: () => void;
  onCancel: () => void;
  isLightModeActive?: boolean;
}

export default function DeclareWinnerModal({
  team,
  remotePlayerCount,
  onDisconnect,
  onResetKeepConnected,
  onCancel,
  isLightModeActive = false,
}: DeclareWinnerModalProps) {
  const teamLabel = team === 'good' ? 'Good' : 'Evil';

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className={cn(
          'w-full max-w-sm rounded-lg p-6 shadow-2xl space-y-4',
          isLightModeActive
            ? 'bg-white border border-clocktower-blood/20 text-gray-800'
            : 'bg-gray-900 border border-gray-800 text-gray-100'
        )}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h3 className="font-bold text-base mb-1">Declare {teamLabel} the winner?</h3>
          <p className={cn('text-sm leading-relaxed', isLightModeActive ? 'text-gray-600' : 'text-gray-300')}>
            This will notify all {remotePlayerCount} connected player{remotePlayerCount === 1 ? '' : 's'}. What should happen next?
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onDisconnect}
            className="w-full py-2.5 px-3 rounded-md text-left bg-clocktower-blood hover:bg-red-800 text-white transition-colors"
          >
            <span className="block font-bold text-sm">Disconnect</span>
            <span className="block text-[11px] opacity-80 font-normal">Return everyone to the Main Menu</span>
          </button>
          <button
            type="button"
            onClick={onResetKeepConnected}
            className="w-full py-2.5 px-3 rounded-md text-left bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            <span className="block font-bold text-sm">Reset Game</span>
            <span className="block text-[11px] opacity-80 font-normal">Back to setup, players stay connected</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'w-full py-2.5 px-3 rounded-md text-sm font-semibold border transition-colors',
              isLightModeActive
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
