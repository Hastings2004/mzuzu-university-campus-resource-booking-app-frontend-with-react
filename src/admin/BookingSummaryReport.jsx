import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../context/appContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from '../assets/logo.png';

export default function BookingSummaryReport() {
    const { token, user } = useContext(AppContext);
    const navigate = useNavigate();

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [resourceType, setResourceType] = useState('');
    const [resourceId, setResourceId] = useState('');
    const [userId, setUserId] = useState('');
    const [userType, setUserType] = useState('');

    // Dropdown data
    const [resourceOptions, setResourceOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);

    // Report data
    const [reportData, setReportData] = useState(null);
    const [reportPeriod, setReportPeriod] = useState({ start_date: '', end_date: '' });
    const [filtersApplied, setFiltersApplied] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Resource types
    const resourceTypeOptions = [
        { value: '', label: 'All Types' },
        { value: 'classrooms', label: 'Classrooms' },
        { value: 'ict_labs', label: 'ICT Labs' },
        { value: 'science_labs', label: 'Science Labs' },
        { value: 'sports', label: 'Sports' },
        { value: 'cars', label: 'Cars' },
        { value: 'auditorium', label: 'Auditorium' },
    ];

    // User types
    const userTypeOptions = [
        { value: '', label: 'All' },
        { value: 'staff', label: 'Staff' },
        { value: 'student', label: 'Student' },
        { value: 'admin', label: 'Admin' },
    ];

    // Set default dates to current month
    useEffect(() => {
        const today = new Date();
        if (!startDate) {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(firstDay.toISOString().split('T')[0]);
        }
        if (!endDate) {
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setEndDate(lastDay.toISOString().split('T')[0]);
        }
    }, []);

    // Fetch resources for dropdown when resourceType changes
    useEffect(() => {
        if (!resourceType) {
            setResourceOptions([]);
            return;
        }
        // TODO: Replace with your actual API endpoint for resources by type
        fetch(`/api/resources?type=${resourceType}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.resources)) {
                    setResourceOptions(data.resources);
                } else {
                    setResourceOptions([]);
                }
            })
            .catch(() => setResourceOptions([]));
    }, [resourceType, token]);

    // Fetch users for dropdown
    useEffect(() => {
        // TODO: Replace with your actual API endpoint for users
        fetch(`/api/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.users)) {
                    setUserOptions(data.users);
                } else {
                    setUserOptions([]);
                }
            })
            .catch(() => setUserOptions([]));
    }, [token]);

    // Fetch report
    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        setReportData(null);
        setFiltersApplied({});
        if (!token) {
            setError('Authentication token missing. Please log in.');
            setLoading(false);
            return;
        }
        // Build query params
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (resourceType) params.append('resource_type', resourceType);
        if (resourceId) params.append('resource_id', resourceId);
        if (userId) params.append('user_id', userId);
        if (userType) params.append('user_type', userType);
        try {
            const response = await fetch(`/api/reports/booking-summary?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setReportData(data.report);
                setReportPeriod(data.period || { start_date: startDate, end_date: endDate });
                setFiltersApplied(data.filters_applied || {});
            } else {
                setError(data.message || 'Failed to fetch report data.');
            }
        } catch (err) {
            setError('An error occurred while fetching the report.');
        } finally {
            setLoading(false);
        }
    }, [token, startDate, endDate, resourceType, resourceId, userId, userType]);

    // PDF generation (optional, can be improved)
    const generatePdfReport = useCallback(() => {
        if (!reportData) {
            alert('No data to generate PDF.');
            return;
        }
        setGeneratingPdf(true);
        try {
            const doc = new jsPDF();
            doc.setFont('times', 'normal');
            // Logo
            try {
                const pageWidth = doc.internal.pageSize.width;
                const logoWidth = 30;
                const logoX = (pageWidth - logoWidth) / 2;
                doc.addImage(logoImage, 'PNG', logoX, 15, logoWidth, 15);
            } catch {}
            doc.setFontSize(14);
            doc.setFont('times', 'bold');
            const systemText = 'Campus Resource Booking System';
            const systemTextWidth = doc.getTextWidth(systemText);
            const pageWidth = doc.internal.pageSize.width;
            const systemTextX = (pageWidth - systemTextWidth) / 2;
            doc.text(systemText, systemTextX, 45);
            doc.setFontSize(16);
            const reportText = 'Booking Summary Report';
            const reportTextWidth = doc.getTextWidth(reportText);
            const reportTextX = (pageWidth - reportTextWidth) / 2;
            doc.text(reportText, reportTextX, 60);
            doc.setFontSize(10);
            doc.setFont('times', 'normal');
            doc.text(`Report Period: ${reportPeriod.start_date} to ${reportPeriod.end_date}`, 14, 80);
            const currentDate = new Date().toLocaleDateString();
            doc.text(`Generated on: ${currentDate}`, 14, 90);
            // Table
            const tableColumn = [
                'Total Bookings',
                'Total Booked Hours',
                'Average Booking Duration',
                'Unique Users',
            ];
            const tableRows = [
                [
                    reportData.total_bookings || 0,
                    reportData.total_booked_hours || 0,
                    reportData.average_booking_duration || 0,
                    reportData.unique_users || 0,
                ],
            ];
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 110,
                theme: 'striped',
                margin: { top: 30 },
                styles: { font: 'times', fontSize: 10 },
                headStyles: { fillColor: [20, 20, 100], font: 'times', fontSize: 10 },
            });
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 15);
                doc.text('This report is generated automatically by the Campus Resource Management System', 14, doc.internal.pageSize.height - 8);
            }
            const filename = `Booking_Summary_Report_${reportPeriod.start_date}_to_${reportPeriod.end_date}.pdf`;
            doc.save(filename);
        } catch {
            alert('Failed to generate PDF.');
        } finally {
            setGeneratingPdf(false);
        }
    }, [reportData, reportPeriod]);

    // Only admins
    if (!user || user.user_type !== 'admin') return null;

    return (
        <div className="report-container">
            <h1>Booking Summary Report</h1>
            <div className="date-filters">
                <label htmlFor="startDate">Start Date:</label>
                <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <label htmlFor="endDate">End Date:</label>
                <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} />
                <label htmlFor="resourceType">Resource Type:</label>
                <select id="resourceType" value={resourceType} onChange={e => { setResourceType(e.target.value); setResourceId(''); }}>
                    {resourceTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <label htmlFor="resourceId">Specific Resource:</label>
                <select id="resourceId" value={resourceId} onChange={e => setResourceId(e.target.value)} disabled={!resourceType}>
                    <option value="">All</option>
                    {resourceOptions.map(res => (
                        <option key={res.id} value={res.id}>{res.name || res.resource_name}</option>
                    ))}
                </select>
                <label htmlFor="userType">User Type:</label>
                <select id="userType" value={userType} onChange={e => setUserType(e.target.value)}>
                    {userTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <label htmlFor="userId">User/Department:</label>
                <select id="userId" value={userId} onChange={e => setUserId(e.target.value)}>
                    <option value="">All</option>
                    {userOptions.map(u => (
                        <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                </select>
                <button onClick={fetchReport} disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</button>
                {reportData && (
                    <button onClick={generatePdfReport} disabled={generatingPdf}>{generatingPdf ? 'Downloading PDF...' : 'Download PDF'}</button>
                )}
            </div>
            {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
            {loading ? (
                <p>Loading report data...</p>
            ) : (
                reportData ? (
                    <>
                        <p className="report-period-info">
                            Report Period: {reportPeriod.start_date} to {reportPeriod.end_date}
                        </p>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Total Bookings</th>
                                    <th>Total Booked Hours</th>
                                    <th>Average Booking Duration</th>
                                    <th>Unique Users</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{reportData.total_bookings}</td>
                                    <td>{reportData.total_booked_hours}</td>
                                    <td>{reportData.average_booking_duration}</td>
                                    <td>{reportData.unique_users}</td>
                                </tr>
                            </tbody>
                        </table>
                    </>
                ) : (
                    !loading && <p>No summary data found for the selected filters. Click "Generate Report" to fetch data.</p>
                )
            )}
        </div>
    );
} 