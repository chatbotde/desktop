
export interface ISafeStorageService {
    isEncryptionAvailable(): boolean;
    encryptString(plainText: string): Buffer;
    decryptString(encrypted: Buffer): string;
    setUsePlainTextEncryption(usePlainText: boolean): void;
    getSelectedStorageBackend(): string;
}
