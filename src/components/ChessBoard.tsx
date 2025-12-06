import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

interface ChessBoardProps {
  game: Chess;
  onMove: (sourceSquare: string, targetSquare: string) => boolean;
  playerColor: 'white' | 'black';
  isPlayerTurn: boolean;
}

export default function ChessBoard({ game, onMove, playerColor, isPlayerTurn }: ChessBoardProps) {
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (!isPlayerTurn) {
      return false;
    }

    return onMove(sourceSquare, targetSquare);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        arePiecesDraggable={() => isPlayerTurn}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#779952' }}
        customLightSquareStyle={{ backgroundColor: '#edeed1' }}
        boardWidth={400}
      />
    </div>
  );
}
