import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

export interface Pharmacy {
  'Sr.No'?: number;
  'Kendra Code'?: string;
  Name: string;
  Contact?: number;
  'State Name'?: string;
  'District Name'?: string;
  'Pin Code'?: number;
  Address: string;
  // Note: No latitude/longitude in database
}

export interface Hospital {
  Sr_No?: number;
  Location_Coordinates?: string;
  Location?: string;
  Hospital_Name: string;
  Hospital_Category?: string;
  Hospital_Care_Type?: string;
  Discipline_Systems_of_Medicine?: string;
  Address_Original_First_Line: string;
  State?: string;
  District?: string;
  Subdistrict?: string;
  Pincode?: string;
  Telephone?: string;
  Mobile_Number?: string;
  Emergency_Num?: string;
  Ambulance_Phone_No?: string;
  Bloodbank_Phone_No?: string;
  Foreign_pcare?: string;
  Tollfree?: string;
  Helpline?: string;
  Hospital_Fax?: string;
  Hospital_Primary_Email_Id?: string;
  Hospital_Secondary_Email_Id?: string;
  Website?: string;
  Specialties?: string;
  Facilities?: string;
  Accreditation?: number;
  Hospital_Regis_Number?: number;
  Registeration_Number_Scan?: number;
  Nodal_Person_Info?: string;
  Nodal_Person_Tele?: string;
  Nodal_Person_Email_Id?: string;
  Town?: string;
  Subtown?: number;
  Village?: number;
  Establised_Year?: number;
  Ayush?: string;
  Miscellaneous_Facilities?: number;
  Number_Doctor?: number;
  Num_Mediconsultant_or_Expert?: number;
  Total_Num_Beds?: string;
  Number_Private_Wards?: number;
  Num_Bed_for_Eco_Weaker_Sec?: number;
  Empanelment_or_Collaboration_with?: number;
  Emergency_Services?: string;
  Tariff_Range?: number;
  State_ID?: number;
  District_ID?: number;
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
      }

      // Open the database
      this.db = SQLite.openDatabaseSync('pharmacies.db');
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
      // Limit results to prevent memory issues on mobile devices
      // TODO: Implement pagination for better performance
      const result = await this.db.getAllAsync(`
        SELECT "Sr.No", "Kendra Code", "Name", "Contact", "State Name", "District Name", "Pin Code", "Address"
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

  async getNearbyPharmacies(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<Pharmacy[]> {
    // Note: Database doesn't contain latitude/longitude data, so nearby search is not supported
    console.warn('Nearby pharmacies search not supported - no location data in database');
    return [];
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

class HospitalDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = FileSystem.documentDirectory + 'hospital.db';
  }

  async initializeDatabase(): Promise<void> {
    try {
      // Check if database already exists in document directory
      const dbExists = await FileSystem.getInfoAsync(this.dbPath);

      if (!dbExists.exists) {
        // Copy database from assets to document directory
        await this.copyDatabaseFromAssets();
      } else {
      }

      // Open the database
      this.db = SQLite.openDatabaseSync(this.dbPath);
    } catch (error) {
      console.error('Error initializing hospital database:', error);
      throw error;
    }
  }

  private async copyDatabaseFromAssets(): Promise<void> {
    try {
      // Load the asset
      const asset = Asset.fromModule(require('@/assets/hospital.db'));

      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error('Failed to download hospital database asset');
      }

      // Copy to document directory
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: this.dbPath,
      });

    } catch (error) {
      console.error('Error copying hospital database from assets:', error);
      throw error;
    }
  }

  async getAllHospitals(): Promise<Hospital[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Limit results to prevent memory issues on mobile devices
      // TODO: Implement pagination for better performance
      const result = await this.db.getAllAsync(`
        SELECT "Sr_No", "Location_Coordinates", "Location", "Hospital_Name", "Hospital_Category",
               "Hospital_Care_Type", "Discipline_Systems_of_Medicine", "Address_Original_First_Line",
               "State", "District", "Subdistrict", "Pincode", "Telephone", "Mobile_Number",
               "Emergency_Num", "Ambulance_Phone_No", "Bloodbank_Phone_No", "Foreign_pcare",
               "Tollfree", "Helpline", "Hospital_Fax", "Hospital_Primary_Email_Id",
               "Hospital_Secondary_Email_Id", "Website", "Specialties", "Facilities",
               "Accreditation", "Hospital_Regis_Number", "Registeration_Number_Scan",
               "Nodal_Person_Info", "Nodal_Person_Tele", "Nodal_Person_Email_Id", "Town",
               "Subtown", "Village", "Establised_Year", "Ayush", "Miscellaneous_Facilities",
               "Number_Doctor", "Num_Mediconsultant_or_Expert", "Total_Num_Beds",
               "Number_Private_Wards", "Num_Bed_for_Eco_Weaker_Sec",
               "Empanelment_or_Collaboration_with", "Emergency_Services", "Tariff_Range",
               "State_ID", "District_ID"
        FROM facilities
        WHERE "Hospital_Name" IS NOT NULL AND "Address_Original_First_Line" IS NOT NULL
        ORDER BY "Hospital_Name"
      `);
      return result as Hospital[];
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      throw error;
    }
  }

  async searchHospitals(query: string): Promise<Hospital[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const searchQuery = `%${query}%`;
      const result = await this.db.getAllAsync(
        'SELECT * FROM facilities WHERE "Hospital_Name" LIKE ? OR "Address_Original_First_Line" LIKE ? ORDER BY "Hospital_Name"',
        [searchQuery, searchQuery],
      );
      return result as Hospital[];
    } catch (error) {
      console.error('Error searching hospitals:', error);
      throw error;
    }
  }

  async getHospitalById(id: number): Promise<Hospital | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getFirstAsync('SELECT * FROM facilities WHERE "Sr_No" = ?', [
        id,
      ]);
      return result as Hospital | null;
    } catch (error) {
      console.error('Error fetching hospital by ID:', error);
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

// Export singleton instances
export const pharmacyDB = new PharmacyDatabase();
export const hospitalDB = new HospitalDatabase();
