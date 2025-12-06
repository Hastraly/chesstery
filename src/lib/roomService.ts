import { supabase, Room } from './supabase';

export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createRoom = async (): Promise<{ room: Room | null; error: Error | null }> => {
  const code = generateRoomCode();

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      code,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) {
    return { room: null, error };
  }

  return { room: data as Room, error: null };
};

export const getRoomByCode = async (code: string): Promise<{ room: Room | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    return { room: null, error };
  }

  return { room: data as Room, error: null };
};

export const joinRoom = async (
  roomId: string,
  playerId: string
): Promise<{ room: Room | null; playerColor: 'white' | 'black' | null; error: Error | null }> => {
  const { data: room, error: fetchError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (fetchError || !room) {
    return { room: null, playerColor: null, error: fetchError };
  }

  if (room.status !== 'waiting' && room.status !== 'in_progress') {
    return { room: null, playerColor: null, error: new Error('Room is not available') };
  }

  if (room.white_player_id === playerId) {
    return { room: room as Room, playerColor: 'white', error: null };
  }

  if (room.black_player_id === playerId) {
    return { room: room as Room, playerColor: 'black', error: null };
  }

  if (!room.white_player_id) {
    const { data, error } = await supabase
      .from('rooms')
      .update({ white_player_id: playerId, status: 'waiting' })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      return { room: null, playerColor: null, error };
    }

    return { room: data as Room, playerColor: 'white', error: null };
  }

  if (!room.black_player_id) {
    const { data, error } = await supabase
      .from('rooms')
      .update({ black_player_id: playerId, status: 'in_progress' })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      return { room: null, playerColor: null, error };
    }

    return { room: data as Room, playerColor: 'black', error: null };
  }

  return { room: null, playerColor: null, error: new Error('Room is full') };
};

export const updateRoomState = async (
  roomId: string,
  fen: string,
  pgn: string,
  currentTurn: 'white' | 'black',
  status: string,
  winner?: string | null
): Promise<{ error: Error | null }> => {
  const updateData: any = {
    fen,
    pgn,
    current_turn: currentTurn,
    status,
    updated_at: new Date().toISOString(),
  };

  if (winner !== undefined) {
    updateData.winner = winner;
  }

  const { error } = await supabase
    .from('rooms')
    .update(updateData)
    .eq('id', roomId);

  return { error };
};

export const saveMove = async (
  roomId: string,
  moveNumber: number,
  fromSquare: string,
  toSquare: string,
  piece: string,
  san: string,
  color: 'white' | 'black'
): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('moves')
    .insert({
      room_id: roomId,
      move_number: moveNumber,
      from_square: fromSquare,
      to_square: toSquare,
      piece,
      san,
      color,
    });

  return { error };
};
