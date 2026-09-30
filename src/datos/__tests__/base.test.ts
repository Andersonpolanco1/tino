import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { obtenerClaveBase } from '../clave';
import { abrirBase, ErrorBaseCifrada } from '../base';

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'despues-del-primer-desbloqueo',
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
jest.mock('expo-crypto', () => ({ getRandomBytesAsync: jest.fn() }));
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn(), deleteDatabaseAsync: jest.fn(), defaultDatabaseDirectory: '/bases' }));
// Si el archivo de la base existe (una base que llegó con el respaldo del teléfono).
let mockExisteBase = false;
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({
    get exists() {
      return mockExisteBase;
    },
    delete: jest.fn(),
  })),
}));

const secure = SecureStore as jest.Mocked<typeof SecureStore>;
const crypto = Crypto as jest.Mocked<typeof Crypto>;
const sqlite = SQLite as jest.Mocked<typeof SQLite>;

const CLAVE = 'ab'.repeat(32);

beforeEach(() => jest.clearAllMocks());

describe('obtenerClaveBase', () => {
  test('genera una clave de 256 bits la primera vez y la guarda solo en este teléfono', async () => {
    secure.getItemAsync.mockResolvedValue(null);
    crypto.getRandomBytesAsync.mockResolvedValue(new Uint8Array(32).fill(0xab));

    expect(await obtenerClaveBase()).toBe(CLAVE);
    expect(crypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
    expect(secure.setItemAsync).toHaveBeenCalledWith(expect.any(String), CLAVE, {
      keychainAccessible: 'despues-del-primer-desbloqueo',
    });
  });

  test('reutiliza la clave guardada', async () => {
    secure.getItemAsync.mockResolvedValue(CLAVE);
    expect(await obtenerClaveBase()).toBe(CLAVE);
    expect(crypto.getRandomBytesAsync).not.toHaveBeenCalled();
    expect(secure.setItemAsync).not.toHaveBeenCalled();
  });

  test('rechaza una clave guardada con formato inválido', async () => {
    secure.getItemAsync.mockResolvedValue("x'; DROP TABLE tarjetas; --");
    await expect(obtenerClaveBase()).rejects.toThrow();
  });
});

// Como expo-sqlite, cada transacción exclusiva corre en una conexión nueva con sus propias sentencias.
function baseSimulada(cipherVersion: string | null, legible = true) {
  const sentencias: string[] = [];
  const transacciones: string[][] = [];
  const db = {
    sentencias,
    transacciones,
    execAsync: jest.fn(async (sql: string) => {
      sentencias.push(sql);
      // La primera lectura real falla si la clave no corresponde a la base.
      if (!legible && sql.startsWith('PRAGMA journal_mode')) throw new Error('file is not a database');
    }),
    getFirstAsync: jest.fn(async (sql: string) => {
      sentencias.push(sql);
      if (sql === 'PRAGMA cipher_version') return cipherVersion ? { cipher_version: cipherVersion } : null;
      if (sql === 'PRAGMA user_version') return { user_version: 0 };
      return null;
    }),
    withExclusiveTransactionAsync: jest.fn(async (tarea: (tx: unknown) => Promise<void>): Promise<void> => {
      const propias: string[] = [];
      transacciones.push(propias);
      await tarea({ execAsync: async (sql: string) => void propias.push(sql) });
    }),
    closeAsync: jest.fn(async () => {}),
  };
  sqlite.openDatabaseAsync.mockResolvedValueOnce(db as unknown as SQLite.SQLiteDatabase);
  return db;
}

describe('abrirBase', () => {
  beforeEach(() => {
    secure.getItemAsync.mockResolvedValue(CLAVE);
    mockExisteBase = false;
    sqlite.openDatabaseAsync.mockReset();
  });

  test('aplica la clave antes de cualquier otra sentencia y migra', async () => {
    const db = baseSimulada('4.6.1 community');
    await abrirBase();
    expect(db.sentencias[0]).toBe(`PRAGMA key = "x'${CLAVE}'"`);
    expect(db.transacciones.flat()).toContain('PRAGMA user_version = 1');
    expect(db.closeAsync).not.toHaveBeenCalled();
  });

  test('cada transacción aplica la clave en su conexión antes de tocar la base', async () => {
    const db = baseSimulada('4.7.0 community');
    const base = await abrirBase();
    await base.transaccion(async tx => void (await tx.execAsync('SELECT 1')));
    expect(db.transacciones.length).toBeGreaterThanOrEqual(2);
    for (const sentencias of db.transacciones) {
      expect(sentencias[0]).toBe(`PRAGMA key = "x'${CLAVE}'"`);
    }
  });

  test('dos aperturas a la vez comparten una sola conexión y una sola clave', async () => {
    secure.getItemAsync.mockResolvedValue(null);
    crypto.getRandomBytesAsync.mockResolvedValue(new Uint8Array(32).fill(0xab));
    baseSimulada('4.6.1 community');
    const [primera, segunda] = await Promise.all([abrirBase(), abrirBase()]);
    expect(primera).toBe(segunda);
    expect(sqlite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    expect(secure.setItemAsync).toHaveBeenCalledTimes(1);
  });

  test('pasada la apertura, reabrir abre una conexión nueva', async () => {
    baseSimulada('4.6.1 community');
    baseSimulada('4.6.1 community');
    const primera = await abrirBase();
    const segunda = await abrirBase();
    expect(primera).not.toBe(segunda);
  });

  test('cerrada, rechaza toda transacción para no volver a crear el archivo con la clave vieja', async () => {
    const db = baseSimulada('4.6.1 community');
    const base = await abrirBase();
    const antes = db.withExclusiveTransactionAsync.mock.calls.length;
    await base.cerrar();
    expect(db.closeAsync).toHaveBeenCalled();
    await expect(base.transaccion(async () => {})).rejects.toThrow('La base está cerrada');
    expect(db.withExclusiveTransactionAsync.mock.calls.length).toBe(antes);
  });

  test('se niega a usar la base si SQLCipher no está activo', async () => {
    const db = baseSimulada(null);
    await expect(abrirBase()).rejects.toThrow(ErrorBaseCifrada);
    expect(db.sentencias.some(s => s.includes('CREATE TABLE'))).toBe(false);
    expect(db.closeAsync).toHaveBeenCalled();
  });

  // Decisión D81: iCloud puede traer la base a un teléfono nuevo, pero no su clave.
  describe('base que llegó del respaldo del teléfono sin su clave', () => {
    beforeEach(() => {
      secure.getItemAsync.mockResolvedValue(null);
      crypto.getRandomBytesAsync.mockResolvedValue(new Uint8Array(32).fill(0xab));
    });

    test('con una clave recién creada, se descarta y se abre una base limpia', async () => {
      mockExisteBase = true;
      const vieja = baseSimulada('4.6.1 community', false);
      const nueva = baseSimulada('4.6.1 community');
      await abrirBase();
      expect(vieja.closeAsync).toHaveBeenCalled();
      expect(sqlite.deleteDatabaseAsync).toHaveBeenCalledWith('tino.db');
      expect(nueva.transacciones.flat()).toContain('PRAGMA user_version = 1');
    });

    test('sin base anterior no se borra nada', async () => {
      baseSimulada('4.6.1 community');
      await abrirBase();
      expect(sqlite.deleteDatabaseAsync).not.toHaveBeenCalled();
    });

    test('si la clave ya existía, un fallo no borra la base', async () => {
      secure.getItemAsync.mockResolvedValue(CLAVE);
      mockExisteBase = true;
      baseSimulada('4.6.1 community', false);
      await expect(abrirBase()).rejects.toThrow('file is not a database');
      expect(sqlite.deleteDatabaseAsync).not.toHaveBeenCalled();
    });

    test('sin SQLCipher no se borra nada aunque la clave sea nueva', async () => {
      mockExisteBase = true;
      baseSimulada(null);
      await expect(abrirBase()).rejects.toThrow(ErrorBaseCifrada);
      expect(sqlite.deleteDatabaseAsync).not.toHaveBeenCalled();
    });
  });
});
