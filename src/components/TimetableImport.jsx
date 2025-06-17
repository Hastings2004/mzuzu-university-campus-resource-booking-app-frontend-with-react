import React, { useState, useContext } from 'react';
import timetableAPI from './timetableApi'; // Ensure this path is correct
import { AppContext } from '../context/appContext'; // Assuming AppContext is here

export default function TimetableImport() {
    const { token } = useContext(AppContext); // Get the token from AppContext

    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState(''); // For success messages
    const [error, setError] = useState('');     // For error messages

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setMessage(''); // Clear any previous messages on new file selection
        setError('');
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a file to import.');
            setMessage('');
            return;
        }

        if (!token) {
            setError('Authentication token missing. Please log in.');
            setMessage('');
            return;
        }

        setImporting(true);
        setMessage(''); // Clear previous messages
        setError('');   // Clear previous errors

        try {
            // Pass the token to the API call
            const data = await timetableAPI.importTimetable(file, token); 
            
            // The API service now handles checking response.ok and data.success
            // So if we reach here, it's a successful operation from the backend's perspective.
            setMessage(data.message || 'Timetable imported successfully!');
            setFile(null); // Clear the selected file input after successful import

        } catch (err) {
            console.error('Import error:', err);
            // The error caught here will be the one thrown by timetableAPI.importTimetable
            // which already extracts the relevant error message.
            setError(err.message || 'An unexpected error occurred during import.');
        } finally {
            setImporting(false); // Always reset importing state
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Import Timetable</h2>
            
            <div className="mb-4">
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    value={file ? undefined : ''} 
                />
                {file && <p className="mt-2 text-sm text-gray-600">Selected file: {file.name}</p>}
            </div>
            
            <button
                onClick={handleImport}
                disabled={importing || !file || !token} // Also disable if token is missing
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
            >
                {importing ? 'Importing...' : 'Import Timetable'}
            </button>
            
            {message && (
                <div className="mt-4 p-3 rounded bg-green-100 text-green-700">
                    {message}
                </div>
            )}
            {error && (
                <div className="mt-4 p-3 rounded bg-red-100 text-red-700">
                    Error: {error}
                </div>
            )}
        </div>
    );
}