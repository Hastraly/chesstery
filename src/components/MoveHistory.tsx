import { Chess } from 'chess.js';
import { ScrollText } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface MoveHistoryProps {
  game: Chess;
}

export default function MoveHistory({ game }: MoveHistoryProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [game.moves({ verbose: true }).length]);

  const history = game.history({ verbose: true });

  const formatMove = (move: any, index: number) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isWhite = index % 2 === 0;

    return {
      moveNumber,
      isWhite,
      san: move.san,
    };
  };

  const groupedMoves: Array<{ moveNumber: number; white: string; black?: string }> = [];

  history.forEach((move, index) => {
    const formatted = formatMove(move, index);

    if (formatted.isWhite) {
      groupedMoves.push({
        moveNumber: formatted.moveNumber,
        white: formatted.san,
      });
    } else {
      const lastMove = groupedMoves[groupedMoves.length - 1];
      if (lastMove) {
        lastMove.black = formatted.san;
      }
    }
  });

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-700">
        <ScrollText className="w-5 h-5 text-slate-400" />
        <h2 className="text-white font-semibold text-lg">Historique des coups</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {groupedMoves.length === 0 ? (
          <div className="text-slate-400 text-center py-8">
            Aucun coup joué
          </div>
        ) : (
          <>
            {groupedMoves.map((move) => (
              <div
                key={move.moveNumber}
                className="bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono text-sm min-w-[2rem]">
                    {move.moveNumber}.
                  </span>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="bg-slate-800 rounded px-3 py-1.5 text-white font-mono text-sm">
                      {move.white}
                    </div>
                    {move.black && (
                      <div className="bg-slate-900 rounded px-3 py-1.5 text-white font-mono text-sm">
                        {move.black}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollEndRef} />
          </>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
