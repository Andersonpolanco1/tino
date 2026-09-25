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
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

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
function baseSimulada(cipherVersion: string | null) {
  const sentencias: string[] = [];
  const transacciones: string[][] = [];
  const db = {
    sentencias,
    transacciones,
    execAsync: jest.fn(async (sql: string) => void sentencias.push(sql)),
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
  sqlite.openDatabaseAsync.mockResolvedValue(db as unknown as SQLite.SQLiteDatabase);
  return db;
}

describe('abrirBase', () => {
  beforeEach(() => secure.getItemAsync.mockResolvedValue(CLAVE));

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

  test('se niega a usar la base si SQLCipher no está activo', async () => {
    const db = baseSimulada(null);
    await expect(abrirBase()).rejects.toThrow(ErrorBaseCifrada);
    expect(db.sentencias.some(s => s.includes('CREATE TABLE'))).toBe(false);
    expect(db.closeAsync).toHaveBeenCalled();
  });
});
