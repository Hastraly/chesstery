import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getRoomByCode } from '../lib/roomService';
import { Crown, Info, X } from 'lucide-react';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCredits, setShowCredits] = useState(false);
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
          <button
            onClick={() => setShowCredits(true)}
            className="mt-3 inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>À propos</span>
          </button>
        </div>
      </div>

      {showCredits && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowCredits(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <Crown className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-slate-900">Chesstery</h2>
              <p className="text-slate-500 text-sm mt-1">Jeu d'échecs multijoueur en ligne</p>
            </div>

            <div className="space-y-6 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">À propos</h3>
                <p className="text-sm">
                  Chesstery est une application web moderne pour jouer aux échecs en temps réel avec vos amis.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Technologie</h3>
                <ul className="text-sm space-y-1">
                  <li>• <strong>React</strong> - Interface utilisateur</li>
                  <li>• <strong>TypeScript</strong> - Typage fort</li>
                  <li>• <strong>Supabase</strong> - Base de données temps réel</li>
                  <li>• <strong>Chess.js</strong> - Moteur d'échecs</li>
                  <li>• <strong>React Chessboard</strong> - Rendu du plateau</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Développement</h3>
                <p className="text-sm">
                  Créé et développé par <strong>Hastaly</strong> avec passion ♥
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center">
                  © 2024 Chesstery. Tous droits réservés.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCredits(false)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
