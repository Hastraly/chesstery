import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Room {
  id: string;
  code: string;
  white_player_id: string | null;
  black_player_id: string | null;
  current_turn: 'white' | 'black';
  fen: string;
  pgn: string;
  status: 'waiting' | 'in_progress' | 'checkmate' | 'stalemate' | 'draw' | 'abandoned';
  winner: string | null;
  created_at: string;
  updated_at: string;
}

export interface Move {
  id: string;
  room_id: string;
  move_number: number;
  from_square: string;
  to_square: string;
  piece: string;
  san: string;
  color: 'white' | 'black';
  created_at: string;
}
