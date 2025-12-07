import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Copy, Check, ArrowLeft, Users, Clock } from 'lucide-react';
import ChessBoard from '../components/ChessBoard';
import MoveHistory from '../components/MoveHistory';
import { supabase, Room } from '../lib/supabase';
import { getRoomByCode, joinRoom, updateRoomState, saveMove } from '../lib/roomService';

export default function Game() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState(new Chess());
  const [room, setRoom] = useState<Room | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [playerId] = useState(() => {
    let id = localStorage.getItem('playerId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('playerId', id);
    }
    return id;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const subscriptionRef = useRef<any>(null);
  const roomIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    initializeGame();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [code, navigate]);

  useEffect(() => {
    if (room && roomIdRef.current && (!room.white_player_id || !room.black_player_id)) {
      setWaitingForOpponent(true);
    } else {
      setWaitingForOpponent(false);
    }
  }, [room]);

  const initializeGame = async () => {
    if (!code) return;

    const { room: fetchedRoom, error: fetchError } = await getRoomByCode(code);

    if (fetchError || !fetchedRoom) {
      setError('Partie introuvable');
      setLoading(false);
      return;
    }

    const { room: joinedRoom, playerColor: color, error: joinError } = await joinRoom(
      fetchedRoom.id,
      playerId
    );

    if (joinError || !joinedRoom || !color) {
      setError(joinError?.message || 'Impossible de rejoindre la partie');
      setLoading(false);
      return;
    }

    roomIdRef.current = joinedRoom.id;
    setRoom(joinedRoom);
    setPlayerColor(color);

    const chessGame = new Chess(joinedRoom.fen);
    setGame(chessGame);

    subscribeToRoom(joinedRoom.id);

    setLoading(false);
  };

  const subscribeToRoom = (roomId: string) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const updatedRoom = payload.new as Room;
          setRoom(updatedRoom);

          if (updatedRoom.fen) {
            const newGame = new Chess(updatedRoom.fen);
            setGame(newGame);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
        }
      });

    subscriptionRef.current = channel;
  };

  const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
    if (!room || !playerColor) return false;

    if (room.status !== 'in_progress') {
      return false;
    }

    if (room.current_turn !== playerColor) {
      return false;
    }

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) {
        return false;
      }

      const newTurn = gameCopy.turn() === 'w' ? 'white' : 'black';
      let gameStatus: string = 'in_progress';
      let winner: string | null = null;

      if (gameCopy.isCheckmate()) {
        gameStatus = 'checkmate';
        winner = playerColor;
      } else if (gameCopy.isStalemate()) {
        gameStatus = 'stalemate';
      } else if (gameCopy.isDraw()) {
        gameStatus = 'draw';
      }

      (async () => {
        await updateRoomState(
          room.id,
          gameCopy.fen(),
          gameCopy.pgn(),
          newTurn,
          gameStatus,
          winner
        );

        const moveHistory = gameCopy.history({ verbose: true });
        const lastMove = moveHistory[moveHistory.length - 1];

        await saveMove(
          room.id,
          moveHistory.length,
          lastMove.from,
          lastMove.to,
          lastMove.piece,
          lastMove.san,
          playerColor
        );
      })();

      setGame(gameCopy);

      return true;
    } catch (error) {
      return false;
    }
  };

  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getGameStatusText = () => {
    if (!room) return '';

    if (waitingForOpponent) {
      return 'En attente du second joueur...';
    }

    switch (room.status) {
      case 'waiting':
        return 'En attente du second joueur...';
      case 'in_progress':
        if (game.isCheck()) {
          return `Échec ! Tour des ${room.current_turn === 'white' ? 'Blancs' : 'Noirs'}`;
        }
        return `Tour des ${room.current_turn === 'white' ? 'Blancs' : 'Noirs'}`;
      case 'checkmate':
        return `Échec et mat ! ${room.winner === 'white' ? 'Blancs' : 'Noirs'} gagnent`;
      case 'stalemate':
        return 'Pat - Match nul';
      case 'draw':
        return 'Match nul';
      case 'abandoned':
        return 'Partie abandonnée';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement de la partie...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="bg-slate-800 rounded-lg px-4 py-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <span className="text-white font-mono font-bold text-lg">{code}</span>
            </div>
            <button
              onClick={copyRoomLink}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copier le lien</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span className="text-white font-medium">{getGameStatusText()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${playerColor === 'white' ? 'bg-slate-100' : 'bg-slate-900'} border-2 ${playerColor === 'white' ? 'border-slate-300' : 'border-amber-500'}`}></div>
                  <span className="text-white font-medium">
                    Vous jouez les {playerColor === 'white' ? 'Blancs' : 'Noirs'}
                  </span>
                </div>
              </div>
              <div className="relative">
                {waitingForOpponent && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
                      <p className="text-white font-medium">En attente de l'adversaire...</p>
                    </div>
                  </div>
                )}
                <ChessBoard
                  game={game}
                  onMove={handleMove}
                  playerColor={playerColor || 'white'}
                  isPlayerTurn={room?.current_turn === playerColor && room?.status === 'in_progress' && !waitingForOpponent}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-white font-semibold mb-4">Joueurs</h3>
              <div className="space-y-3">
                <div className={`rounded-lg p-3 flex items-center gap-3 ${room?.white_player_id ? 'bg-green-900/30' : 'bg-slate-700'}`}>
                  <div className={`w-3 h-3 rounded-full ${room?.white_player_id ? 'bg-green-400' : 'bg-slate-400'}`}></div>
                  <span className="text-white text-sm">Blancs {room?.white_player_id ? '✓' : '(en attente)'}</span>
                </div>
                <div className={`rounded-lg p-3 flex items-center gap-3 ${room?.black_player_id ? 'bg-green-900/30' : 'bg-slate-700'}`}>
                  <div className={`w-3 h-3 rounded-full ${room?.black_player_id ? 'bg-green-400' : 'bg-slate-400'}`}></div>
                  <span className="text-white text-sm">Noirs {room?.black_player_id ? '✓' : '(en attente)'}</span>
                </div>
              </div>
            </div>
            <MoveHistory game={game} />
          </div>
        </div>
      </div>
    </div>
  );
}
