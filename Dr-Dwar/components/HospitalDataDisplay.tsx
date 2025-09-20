import React, { useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';

interface Hospital {
  Sr_No: number;
  Hospital_Name: string;
  Hospital_Category: string;
  Hospital_Care_Type: string;
  State: string;
  District: string;
  Subdistrict: string;
  Address_Original_First_Line: string;
  Pincode: string;
  Telephone: string;
  Mobile_Number: string;
  Emergency_Num: string;
  Hospital_Primary_Email_Id: string;
  Website: string;
  Specialties: string;
  Facilities: string;
  Total_Num_Beds: string;
  Emergency_Services: string;
  Number_Doctor: number;
  Establised_Year: number;
}

export default function HospitalDataDisplay() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadHospitalData();
  }, []);

  useEffect(() => {
    filterHospitals();
  }, [searchQuery, stateFilter, categoryFilter, hospitals]);

  const loadHospitalData = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('facilities.db');

      const result = await db.getAllAsync(`
        SELECT * FROM facilities 
        ORDER BY Hospital_Name
      `);

      const hospitalData = result as Hospital[];
      setHospitals(hospitalData);

      // Extract unique states and categories for filters
      const uniqueStates = [...new Set(hospitalData.map((h) => h.State).filter(Boolean))];
      const uniqueCategories = [
        ...new Set(hospitalData.map((h) => h.Hospital_Category).filter(Boolean)),
      ];

      setStates(uniqueStates.sort());
      setCategories(uniqueCategories.sort());
      setLoading(false);
    } catch (error) {
      console.error('Failed to load hospital data:', error);
      setLoading(false);
    }
  };

  const filterHospitals = () => {
    let filtered = hospitals;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (hospital) =>
          hospital.Hospital_Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hospital.District?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hospital.Specialties?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (stateFilter) {
      filtered = filtered.filter((hospital) => hospital.State === stateFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter((hospital) => hospital.Hospital_Category === categoryFilter);
    }

    setFilteredHospitals(filtered);
    setCurrentPage(1);
  };

  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl">Loading hospital data...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Hospital Directory</h1>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search hospitals, districts, specialties..."
            className="rounded border border-gray-300 px-3 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="rounded border border-gray-300 px-3 py-2"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          <select
            className="rounded border border-gray-300 px-3 py-2"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredHospitals.length} of {hospitals.length} hospitals
        </div>
      </div>

      {/* Hospital Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedHospitals.map((hospital) => (
          <div key={hospital.Sr_No} className="rounded-lg border bg-white p-4 shadow">
            <h3 className="mb-2 text-lg font-semibold text-blue-800">{hospital.Hospital_Name}</h3>

            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Category:</span> {hospital.Hospital_Category}
              </p>
              <p>
                <span className="font-medium">Location:</span> {hospital.District}, {hospital.State}
              </p>
              <p>
                <span className="font-medium">Address:</span> {hospital.Address_Original_First_Line}
              </p>

              {hospital.Telephone && (
                <p>
                  <span className="font-medium">Phone:</span> {hospital.Telephone}
                </p>
              )}

              {hospital.Emergency_Num && (
                <p className="text-red-600">
                  <span className="font-medium">Emergency:</span> {hospital.Emergency_Num}
                </p>
              )}

              {hospital.Total_Num_Beds && (
                <p>
                  <span className="font-medium">Beds:</span> {hospital.Total_Num_Beds}
                </p>
              )}

              {hospital.Number_Doctor && (
                <p>
                  <span className="font-medium">Doctors:</span> {hospital.Number_Doctor}
                </p>
              )}

              {hospital.Specialties && (
                <p className="text-green-600">
                  <span className="font-medium">Specialties:</span> {hospital.Specialties}
                </p>
              )}

              {hospital.Website && (
                <p>
                  <span className="font-medium">Website:</span>
                  <a
                    href={hospital.Website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-500 hover:underline"
                  >
                    Visit
                  </a>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
