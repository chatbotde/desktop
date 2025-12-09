
import { safeStorage } from 'electron';
import { ISafeStorageService } from './ISafeStorageService';

export class ElectronSafeStorageService implements ISafeStorageService {
    isEncryptionAvailable(): boolean {
        return safeStorage.isEncryptionAvailable();
    }

    encryptString(plainText: string): Buffer {
        return safeStorage.encryptString(plainText);
    }

    decryptString(encrypted: Buffer): string {
        return safeStorage.decryptString(encrypted);
    }

    setUsePlainTextEncryption(usePlainText: boolean): void {
        safeStorage.setUsePlainTextEncryption(usePlainText);
    }

    getSelectedStorageBackend(): string {
        return safeStorage.getSelectedStorageBackend();
    }
}
