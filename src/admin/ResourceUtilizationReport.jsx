import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../context/appContext'; // Assuming AppContext provides token and user
import { useNavigate } from 'react-router-dom'; // For redirection

export default function ResourceUtilizationReport() {
    const { token, user } = useContext(AppContext);
    const navigate = useNavigate();

    const [reportData, setReportData] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportPeriod, setReportPeriod] = useState({ start_date: '', end_date: '' });

    // Authorization check: Only admins can access this page
    useEffect(() => {
        if (!user) {
            navigate('/login'); // Not logged in, redirect
            return;
        }
        if (user.user_type !== 'admin') {
            alert("Unauthorized access. Only administrators can view reports.");
            navigate('/'); // Logged in but not admin, redirect to home
        }
        // Initialize dates to current month if not already set
        const today = new Date();
        if (!startDate) {
            setStartDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
        }
        if (!endDate) {
            setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]);
        }
    }, [user, navigate, startDate, endDate]);


    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        setReportData([]);

        if (!token) {
            setError("Authentication token missing. Please log in.");
            setLoading(false);
            return;
        }
        if (!startDate || !endDate) {
            setError("Please select both start and end dates.");
            setLoading(false);
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError("Start date cannot be after end date.");
            setLoading(false);
            return;
        }

        try {
            const queryParams = new URLSearchParams({
                start_date: startDate,
                end_date: endDate,
            }).toString();

            const response = await fetch(`/api/reports/resource-utilization?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setReportData(data.report);
                setReportPeriod(data.period); // Store the actual period used by backend
            } else {
                setError(data.message || "Failed to fetch report data.");
                console.error("API Error fetching report:", data);
            }
        } catch (err) {
            setError("An error occurred while fetching the report. Please check your network connection.");
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [token, startDate, endDate]);

    // Fetch report initially and when dates change (or on mount if user is admin)
    useEffect(() => {
        if (user && user.user_type === 'admin' && startDate && endDate) {
            fetchReport();
        }
    }, [fetchReport, user, startDate, endDate]); // Depend on startDate/endDate to refetch on change

    const handleGenerateReport = () => {
        fetchReport(); // Manually trigger fetch when button is clicked
    };

    if (!user || user.user_type !== 'admin') {
        return null; // Or a Forbidden message component
    }

    return (
        <div className="report-container">
            <h1>Resource Utilization Report</h1>

            <div className="date-filters">
                <label htmlFor="startDate">Start Date:</label>
                <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />

                <label htmlFor="endDate">End Date:</label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />

                <button onClick={handleGenerateReport} disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            {loading ? (
                <p>Loading report data...</p>
            ) : (
                <>
                    {reportData.length > 0 ? (
                        <>
                            <p className="report-period-info">
                                Report Period: {reportPeriod.start_date} to {reportPeriod.end_date}
                            </p>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Resource Name</th>
                                        <th>Total Booked Hours</th>
                                        <th>Total Available Hours</th>
                                        <th>Utilization Percentage (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((item) => (
                                        <tr key={item.resource_id}>
                                            <td>{item.resource_name}</td>
                                            <td>{item.total_booked_hours}</td>
                                            <td>{item.total_available_hours_in_period}</td>
                                            <td className={item.utilization_percentage > 70 ? 'high-utilization' : ''}>
                                                {item.utilization_percentage}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <p>No utilization data found for the selected period.</p>
                    )}
                </>
            )}
        </div>
    );
}