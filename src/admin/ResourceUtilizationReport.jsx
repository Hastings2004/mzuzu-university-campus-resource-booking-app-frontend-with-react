import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../context/appContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from '../assets/logo.png';

export default function ResourceUtilizationReport() {
    const { token, user } = useContext(AppContext);
    const navigate = useNavigate();

    const [reportData, setReportData] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false); // Changed from true to false
    const [error, setError] = useState(null);
    const [reportPeriod, setReportPeriod] = useState({ start_date: '', end_date: '' });
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Authorization check: Only admins can access this page
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.user_type !== 'admin') {
            alert("Unauthorized access. Only administrators can view reports.");
            navigate('/'); 
            return;
        }
        
        // Initialize dates to current month if not already set
        const today = new Date();
        if (!startDate) {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(firstDay.toISOString().split('T')[0]);
        }
        if (!endDate) {
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setEndDate(lastDay.toISOString().split('T')[0]);
        }
    }, [user, navigate]); // Removed startDate, endDate from dependencies

    const fetchReport = useCallback(async () => {
        console.log('fetchReport called with:', { startDate, endDate, token: !!token });
        
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

            console.log('Making API request to:', `/api/reports/resource-utilization?${queryParams}`);

            const response = await fetch(`/api/reports/resource-utilization?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok && data.success) {
                // Fixed: Backend returns data in 'report' field, not 'data'
                const reportArray = Array.isArray(data.report) ? data.report : [];
                setReportData(reportArray);
                
                // Fixed: Backend returns period data differently
                if (data.period) {
                    setReportPeriod({ 
                        start_date: data.period.start_date, 
                        end_date: data.period.end_date 
                    });
                } else {
                    setReportPeriod({ start_date: startDate, end_date: endDate });
                }
                
                console.log('Report data set:', reportArray);
            } else {
                const errorMessage = data.message || "Failed to fetch report data.";
                setError(errorMessage);
                setReportData([]);
                console.error("API Error fetching report:", data);
            }
        } catch (err) {
            const errorMessage = "An error occurred while fetching the report. Please check your network connection.";
            setError(errorMessage);
            setReportData([]);
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [token, startDate, endDate]);

    // Function to generate PDF
    const generatePdfReport = useCallback(() => {
        console.log('generatePdfReport called, reportData length:', reportData.length);
        
        if (!reportData || reportData.length === 0) {
            alert("No data to generate PDF. Please generate the report first.");
            return;
        }

        setGeneratingPdf(true);
        try {
            const doc = new jsPDF();

            // Set font to Times New Roman
            doc.setFont('times', 'normal');

            // Add logo (you can replace this with your actual logo path)
            try {
                const pageWidth = doc.internal.pageSize.width;
                const logoWidth = 30;
                const logoX = (pageWidth - logoWidth) / 2;
                doc.addImage(logoImage, 'PNG', logoX, 15, logoWidth, 15);
            } catch (logoError) {
                console.warn('Could not load logo:', logoError);
                // Continue without logo if it fails to load
            }
            
            // Add company name and header information
            doc.setFontSize(14);
            doc.setFont('times', 'bold');
            const systemText = 'Campus Resource Booking System';
            const systemTextWidth = doc.getTextWidth(systemText);
            const pageWidth = doc.internal.pageSize.width;
            const systemTextX = (pageWidth - systemTextWidth) / 2;
            doc.text(systemText, systemTextX, 45);
            
            // Add report title
            doc.setFontSize(16);
            const reportText = 'Resource Utilization Report';
            const reportTextWidth = doc.getTextWidth(reportText);
            const reportTextX = (pageWidth - reportTextWidth) / 2;
            doc.text(reportText, reportTextX, 60);
            
            // Add report period
            doc.setFontSize(10);
            doc.setFont('times', 'normal');
            doc.text(`Report Period: ${reportPeriod.start_date} to ${reportPeriod.end_date}`, 14, 80);
            
            // Add generation date
            const currentDate = new Date().toLocaleDateString();
            doc.text(`Generated on: ${currentDate}`, 14, 90);
            
            // Add additional header information
            doc.text('Department: Information Technology', 14, 100);
            doc.text('Report Type: Monthly Utilization Analysis', 14, 110);

            // Prepare table data
            const tableColumn = ["Resource Name", "Total Booked Hours", "Total Available Hours", "Utilization Percentage (%)"];
            const tableRows = [];

            reportData.forEach(item => {
                const rowData = [
                    item.resource_name || 'N/A',
                    item.total_booked_hours || '0',
                    item.total_available_hours_in_period || '0',
                    `${item.utilization_percentage || '0'}%`
                ];
                tableRows.push(rowData);
            });

            console.log('PDF table data:', { tableColumn, tableRows });

            // Generate table using autoTable
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 125, // Increased startY to accommodate header content with more spacing
                theme: 'striped',
                headStyles: { fillColor: [20, 20, 100] },
                margin: { top: 30 },
                styles: {
                    font: 'times',
                    fontSize: 10
                },
                headStyles: {
                    fillColor: [20, 20, 100],
                    font: 'times',
                    fontSize: 10
                }
            });

            // Add footer information
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                // Add page number
                doc.setFontSize(8);
                doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 15);
                
                // Add footer text with more spacing
                doc.text('This report is generated automatically by the Campus Resource Management System', 14, doc.internal.pageSize.height - 8);
                doc.text('For questions or concerns, please contact the IT department', 14, doc.internal.pageSize.height - 3);
            }

            // Save PDF
            const filename = `Resource_Utilization_Report_${reportPeriod.start_date}_to_${reportPeriod.end_date}.pdf`;
            doc.save(filename);
            console.log('PDF saved as:', filename);
            
        } catch (pdfError) {
            console.error("Error generating PDF:", pdfError);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setGeneratingPdf(false);
        }
    }, [reportData, reportPeriod]);

    // Remove automatic fetch on mount - only fetch when user clicks generate
    const handleGenerateReport = () => {
        console.log('Generate Report button clicked');
        fetchReport();
    };

    if (!user || user.user_type !== 'admin') {
        return null;
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

                {reportData.length > 0 && (
                    <button onClick={generatePdfReport} disabled={generatingPdf}>
                        {generatingPdf ? 'Downloading PDF...' : 'Download PDF'}
                    </button>
                )}
            </div>

            {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}

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
                                    {reportData.map((item, index) => (
                                        <tr key={item.resource_id || index}>
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
                        !loading && <p>No utilization data found for the selected period. Click "Generate Report" to fetch data.</p>
                    )}
                </>
            )}
        </div>
    );
}