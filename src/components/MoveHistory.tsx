import { ScrollText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface MoveHistoryProps {
  roomId: string;
}

interface MoveData {
  move_number: number;
  san: string;
  color: 'white' | 'black';
}

export default function MoveHistory({ roomId }: MoveHistoryProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const [moves, setMoves] = useState<MoveData[]>([]);

  useEffect(() => {
    const loadMoves = async () => {
      const { data, error } = await supabase
        .from('moves')
        .select('move_number, san, color')
        .eq('room_id', roomId)
        .order('move_number', { ascending: true });

      if (!error && data) {
        setMoves(data);
      }
    };

    loadMoves();

    const channel = supabase
      .channel(`room-moves:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moves',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMoves((prev) => [...prev, payload.new as MoveData]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [moves.length]);

  const groupedMoves: Array<{ moveNumber: number; white: string; black?: string }> = [];

  moves.forEach((move) => {
    if (move.color === 'white') {
      groupedMoves.push({
        moveNumber: move.move_number,
        white: move.san,
      });
    } else {
      const existingMove = groupedMoves.find((m) => m.moveNumber === move.move_number);
      if (existingMove) {
        existingMove.black = move.san;
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
