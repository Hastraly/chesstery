import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getRoomByCode } from '../lib/roomService';
import { Crown } from 'lucide-react';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');

    const { room, error: createError } = await createRoom();

    if (createError || !room) {
      setError('Erreur lors de la création de la partie');
      setLoading(false);
      return;
    }

    navigate(`/game/${room.code}`);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode.trim()) {
      setError('Veuillez entrer un code de partie');
      return;
    }

    setLoading(true);
    setError('');

    const { room, error: fetchError } = await getRoomByCode(roomCode.toUpperCase());

    if (fetchError || !room) {
      setError('Partie introuvable');
      setLoading(false);
      return;
    }

    if (room.status !== 'waiting' && room.status !== 'in_progress') {
      setError('Cette partie est terminée');
      setLoading(false);
      return;
    }

    navigate(`/game/${room.code}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-16 h-16 text-amber-500" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Chesstery</h1>
          <p className="text-slate-300">Créez une partie ou affrontez un ami!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div>
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer une partie'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 font-medium">OU</span>
            </div>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-slate-700 mb-2">
                Code de jeu
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123"
                maxLength={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-lg font-mono text-center uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Rejoindre une partie'}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>Partagez le code avec votre adversaire pour commencer</p>
          <p className="mt-1">Crée et développé par Hastaly avec ♥</p>
        </div>
      </div>
    </div>
  );
}
