import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

export interface Pharmacy {
  'Sr.No'?: number;
  'Kendra Code'?: string;
  Name?: string;
  Contact?: number;
  'State Name'?: string;
  'District Name'?: string;
  'Pin Code'?: number;
  Address?: string;
}

class PharmacyDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = FileSystem.documentDirectory + 'pharmacies.db';
  }

  async initializeDatabase(): Promise<void> {
    try {
      // Check if database already exists in document directory
      const dbExists = await FileSystem.getInfoAsync(this.dbPath);

      if (!dbExists.exists) {
        // Copy database from assets to document directory
        await this.copyDatabaseFromAssets();
      } else {
        console.log('Database already exists, skipping copy');
      }

      // Open the database
      this.db = SQLite.openDatabaseSync(this.dbPath);

      // Check tables and data
      const tables = await this.db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'");

      if (tables.length > 0) {
        const count = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM facilities');
        console.log('Total records in facilities table:', count);
      }
    } catch (error) {
      console.error('Error initializing pharmacy database:', error);
      throw error;
    }
  }

  private async copyDatabaseFromAssets(): Promise<void> {
    try {
      // Load the asset
      const asset = Asset.fromModule(require('@/assets/pharmacies.db'));

      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error('Failed to download pharmacy database asset');
      }

      // Copy to document directory
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: this.dbPath,
      });
    } catch (error) {
      console.error('Error copying pharmacy database from assets:', error);
      throw error;
    }
  }

  async getAllPharmacies(): Promise<Pharmacy[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Check if facilities table exists and has data
      const countResult = (await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM facilities',
      )) as { count?: number };

      if ((countResult?.count ?? 0) === 0) {
        return [];
      }

      const result = await this.db.getAllAsync(`
        SELECT "Sr.No", "Kendra Code", "Name", "Contact", "State Name",
               "District Name", "Pin Code", "Address"
        FROM facilities
        WHERE "Name" IS NOT NULL AND "Address" IS NOT NULL
        ORDER BY "Name"
      `);
      return result as Pharmacy[];
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      throw error;
    }
  }

  async searchPharmacies(query: string): Promise<Pharmacy[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const searchQuery = `%${query}%`;
      const result = await this.db.getAllAsync(
        'SELECT * FROM facilities WHERE "Name" LIKE ? OR "Address" LIKE ? ORDER BY "Name"',
        [searchQuery, searchQuery],
      );
      return result as Pharmacy[];
    } catch (error) {
      console.error('Error searching pharmacies:', error);
      throw error;
    }
  }

  async getPharmacyById(id: number): Promise<Pharmacy | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getFirstAsync('SELECT * FROM facilities WHERE "Sr.No" = ?', [
        id,
      ]);
      return result as Pharmacy | null;
    } catch (error) {
      console.error('Error fetching pharmacy by ID:', error);
      throw error;
    }
  }

  closeDatabase(): void {
    if (this.db) {
      this.db.closeSync();
      this.db = null;
    }
  }
}

export const pharmacyDB = new PharmacyDatabase();
