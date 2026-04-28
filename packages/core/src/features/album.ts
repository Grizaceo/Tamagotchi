import type { PetState } from '../model/PetState';

export interface AlbumEntry {
  id: string;
  name: string;
  description: string;
  petLine: string;
  spriteKey: string;
  rewardAnimation?: string;
  rewardFrame?: number;
}

export const ALBUM_CATALOG: AlbumEntry[] = [
  // FLAN (8 entries)
  { id: 'album_flan_1', name: 'Primer Bocado', description: 'Flan comiendo su primera galleta', petLine: 'flan', spriteKey: 'album_flan_1', rewardAnimation: 'eat', rewardFrame: 2 },
  { id: 'album_flan_2', name: 'Siesta Dulce', description: 'Flan durmiendo plácidamente', petLine: 'flan', spriteKey: 'album_flan_2', rewardAnimation: 'sleep' },
  { id: 'album_flan_3', name: 'Salto de Alegría', description: 'Flan saltando muy feliz', petLine: 'flan', spriteKey: 'album_flan_3', rewardAnimation: 'happy', rewardFrame: 0 },
  { id: 'album_flan_4', name: 'Alegría Pura', description: 'Un momento de máxima felicidad', petLine: 'flan', spriteKey: 'album_flan_4', rewardAnimation: 'happy', rewardFrame: 1 },
  { id: 'album_flan_5', name: 'Mirada Curiosa', description: 'Flan explorando el mundo', petLine: 'flan', spriteKey: 'album_flan_5', rewardAnimation: 'idle' },
  { id: 'album_flan_6', name: 'Berrinche', description: 'Flan cuando tiene mucha hambre', petLine: 'flan', spriteKey: 'album_flan_6', rewardAnimation: 'sad' },
  { id: 'album_flan_7', name: 'Súper Saludable', description: 'Flan rebosando de energía', petLine: 'flan', spriteKey: 'album_flan_7', rewardAnimation: 'happy' },
  { id: 'album_flan_8', name: 'Gran Amistad', description: 'Flan siente mucho cariño por ti', petLine: 'flan', spriteKey: 'album_flan_8', rewardAnimation: 'happy' },

  // SEAL (8 entries)
  { id: 'album_seal_1', name: 'Primer Bocado', description: 'Seal disfrutando su comida', petLine: 'seal', spriteKey: 'album_seal_1', rewardAnimation: 'eat', rewardFrame: 2 },
  { id: 'album_seal_2', name: 'Siesta Dulce', description: 'Seal durmiendo en las nubes', petLine: 'seal', spriteKey: 'album_seal_2', rewardAnimation: 'sleep' },
  { id: 'album_seal_3', name: 'Salto de Alegría', description: 'Seal saltando de felicidad', petLine: 'seal', spriteKey: 'album_seal_3', rewardAnimation: 'happy', rewardFrame: 0 },
  { id: 'album_seal_4', name: 'Alegría Pura', description: 'Seal muy emocionado', petLine: 'seal', spriteKey: 'album_seal_4', rewardAnimation: 'happy', rewardFrame: 1 },
  { id: 'album_seal_5', name: 'Pescado Fresco', description: 'Seal disfrutando un pescado', petLine: 'seal', spriteKey: 'album_seal_5', rewardAnimation: 'eat' },
  { id: 'album_seal_6', name: 'Berrinche', description: 'Seal cuando no se siente bien', petLine: 'seal', spriteKey: 'album_seal_6', rewardAnimation: 'sad' },
  { id: 'album_seal_7', name: 'Ojos Brillantes', description: 'Seal explorando el entorno', petLine: 'seal', spriteKey: 'album_seal_7', rewardAnimation: 'happy' },
  { id: 'album_seal_8', name: 'Gran Amistad', description: 'Seal te quiere mucho', petLine: 'seal', spriteKey: 'album_seal_8', rewardAnimation: 'happy' },

  // FIU (8 entries)
  { id: 'album_fiu_1', name: 'Primer Bocado', description: 'Fiu comiendo sus semillas', petLine: 'fiu', spriteKey: 'album_fiu_1', rewardAnimation: 'eat', rewardFrame: 2 },
  { id: 'album_fiu_2', name: 'Siesta Dulce', description: 'Fiu descansando en su nido', petLine: 'fiu', spriteKey: 'album_fiu_2', rewardAnimation: 'sleep' },
  { id: 'album_fiu_3', name: 'Salto de Alegría', description: 'Fiu saltando feliz', petLine: 'fiu', spriteKey: 'album_fiu_3', rewardAnimation: 'happy', rewardFrame: 0 },
  { id: 'album_fiu_4', name: 'Alegría Pura', description: 'Fiu cantando con amor', petLine: 'fiu', spriteKey: 'album_fiu_4', rewardAnimation: 'happy', rewardFrame: 1 },
  { id: 'album_fiu_5', name: 'Cazador de Semillas', description: 'Fiu buscando comida', petLine: 'fiu', spriteKey: 'album_fiu_5', rewardAnimation: 'idle' },
  { id: 'album_fiu_6', name: 'Berrinche', description: 'Fiu necesita atención', petLine: 'fiu', spriteKey: 'album_fiu_6', rewardAnimation: 'sad' },
  { id: 'album_fiu_7', name: 'Vuelo Acrobático', description: 'Fiu haciendo piruetas', petLine: 'fiu', spriteKey: 'album_fiu_7', rewardAnimation: 'happy' },
  { id: 'album_fiu_8', name: 'Gran Amistad', description: 'Fiu te dedica una canción', petLine: 'fiu', spriteKey: 'album_fiu_8', rewardAnimation: 'happy' },

  // SALCHICHA (8 entries)
  { id: 'album_salchicha_1', name: 'Primer Bocado', description: 'Salchicha con su primera galleta', petLine: 'salchicha', spriteKey: 'album_salchicha_1', rewardAnimation: 'eat', rewardFrame: 2 },
  { id: 'album_salchicha_2', name: 'Siesta Dulce', description: 'Salchicha durmiendo estirado', petLine: 'salchicha', spriteKey: 'album_salchicha_2', rewardAnimation: 'sleep' },
  { id: 'album_salchicha_3', name: 'Salto de Alegría', description: 'Salchicha saltando contento', petLine: 'salchicha', spriteKey: 'album_salchicha_3', rewardAnimation: 'happy', rewardFrame: 0 },
  { id: 'album_salchicha_4', name: 'Alegría Pura', description: 'Salchicha moviendo la cola', petLine: 'salchicha', spriteKey: 'album_salchicha_4', rewardAnimation: 'happy', rewardFrame: 1 },
  { id: 'album_salchicha_5', name: 'Olfateando', description: 'Salchicha buscando rastros', petLine: 'salchicha', spriteKey: 'album_salchicha_5', rewardAnimation: 'idle' },
  { id: 'album_salchicha_6', name: 'Berrinche', description: 'Salchicha cuando está triste', petLine: 'salchicha', spriteKey: 'album_salchicha_6', rewardAnimation: 'sad' },
  { id: 'album_salchicha_7', name: 'Ladrido de Alerta', description: 'Salchicha protegiéndote', petLine: 'salchicha', spriteKey: 'album_salchicha_7', rewardAnimation: 'happy' },
  { id: 'album_salchicha_8', name: 'Gran Amistad', description: 'Salchicha te da un beso', petLine: 'salchicha', spriteKey: 'album_salchicha_8', rewardAnimation: 'happy' },
];

export function evaluateAlbumUnlocks(state: PetState): PetState {
  const newUnlocks: Record<string, boolean> = { ...state.album } as any;
  let changed = false;

  const counts = state.counts || { feed: 0, play: 0, rest: 0, medicate: 0, pet: 0, totalActions: 0 };

  ALBUM_CATALOG.forEach(entry => {
    if (newUnlocks[entry.id]) return;
    if (entry.petLine !== state.petLine) return;

    let unlocked = false;
    const index = parseInt(entry.id.split('_').pop() || '0');

    switch (index) {
      case 1: unlocked = counts.feed >= 1; break;
      case 2: unlocked = counts.rest >= 1; break;
      case 3: unlocked = counts.play >= 1; break;
      case 4: unlocked = state.stats.happiness >= 90; break;
      case 5: unlocked = state.totalTicks >= 600; break;
      case 6: unlocked = state.stats.hunger >= 80; break;
      case 7: unlocked = state.stats.health >= 90; break;
      case 8: unlocked = state.stats.affection >= 80; break;
    }

    if (unlocked) {
      newUnlocks[entry.id] = true;
      changed = true;
    }
  });

  if (!changed) return state;

  return {
    ...state,
    album: newUnlocks as any
  };
}

export function getAlbumEntryById(id: string): AlbumEntry | undefined {
  return ALBUM_CATALOG.find(e => e.id === id);
}

