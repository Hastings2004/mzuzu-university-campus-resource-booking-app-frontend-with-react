import { useContext, useEffect, useState, useRef } from "react"; // Import useRef
import { AppContext } from "../context/appContext";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement } from "chart.js";
import 'chart.js/auto';
import jsPDF from 'jspdf'; 
import html2canvas from 'html2canvas'; 
import 'jspdf-autotable';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement);

export default function Statistical() {
    const { user, token } = useContext(AppContext);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generatingPdf, setGeneratingPdf] = useState(false); // New state for PDF generation loading

    // Refs for each chart container for capturing with html2canvas
    const bookingsByStatusChartRef = useRef(null);
    const topBookedResourcesChartRef = useRef(null);
    const resourcesAvailabilityChartRef = useRef(null);
    const monthlyBookingsChartRef = useRef(null);
    const resourceUtilizationChartRef = useRef(null);
    const myBookingsChartRef = useRef(null);
    const currentResourceAvailabilityChartRef = useRef(null); // Ref for the specific chart in user view

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) { // No user, so no data to fetch
                setError("Authentication required: Please log in to view the dashboard.");
                setLoading(false);
                return;
            }
            if (!token) {
                setError("Authentication required: Please log in to view the dashboard.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch("/api/dashboard-stats", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    setDashboardData(data);
                } else {
                    setError(data.message || "Failed to fetch dashboard data.");
                    console.error("Dashboard data fetch error:", data);
                }
            } catch (err) {
                setError("Network error or server unavailable.");
                console.error("Dashboard fetch network error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, token]);

    // --- Chart Data Preparation (Common & Admin Specific) ---
    // (Your existing chart data preparations go here, unchanged)
    const bookingsByStatusChartData = {
        labels: Object.keys(dashboardData?.bookings_by_status || {}), // Added optional chaining
        datasets: [{
            label: 'Number of Bookings',
            data: Object.values(dashboardData?.bookings_by_status || {}), // Added optional chaining
            backgroundColor: [
                'rgba(75, 192, 192, 0.6)', // Approved
                'rgba(255, 206, 86, 0.6)', // Pending
                'rgba(255, 99, 132, 0.6)', // Rejected
                'rgba(54, 162, 235, 0.6)', // Cancelled
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)',
            ],
            borderWidth: 1,
        }],
    };

    const resourcesAvailabilityChartData = {
        labels: dashboardData?.resource_availability?.map(r => r.name) || [], // Added optional chaining
        datasets: [{
            label: 'Availability Status',
            data: dashboardData?.resource_availability?.map(r => r.count) || [], // Added optional chaining
            backgroundColor: [
                'rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(201, 203, 207, 0.6)', 'rgba(54, 162, 235, 0.6)',
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(201, 203, 207, 1)', 'rgba(54, 162, 235, 1)',
            ],
            borderWidth: 1,
        }],
    };

    const topBookedResourcesChartData = {
        labels: dashboardData?.top_booked_resources?.map(r => r.resource_name) || [], // Added optional chaining
        datasets: [{
            label: 'Total Bookings',
            data: dashboardData?.top_booked_resources?.map(r => r.total_bookings) || [], // Added optional chaining
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
        }],
    };

    const monthlyBookingsChartData = {
        labels: dashboardData?.monthly_bookings?.map(item => item.month) || [], // Added optional chaining
        datasets: [{
            label: 'Total Bookings',
            data: dashboardData?.monthly_bookings?.map(item => item.total_bookings) || [], // Added optional chaining
            fill: false, borderColor: 'rgba(75, 192, 192, 1)', tension: 0.3,
            pointRadius: 5, pointHoverRadius: 8, pointBackgroundColor: 'rgba(75, 192, 192, 1)', pointBorderColor: '#fff', pointBorderWidth: 2,
        }],
    };

    const resourceUtilizationChartData = {
        labels: dashboardData?.resource_utilization_monthly?.map(item => item.month) || [], // Added optional chaining
        datasets: [{
            label: 'Total Booked Hours',
            data: dashboardData?.resource_utilization_monthly?.map(item => item.total_booked_hours) || [], // Added optional chaining
            fill: true, backgroundColor: 'rgba(255, 159, 64, 0.2)', borderColor: 'rgba(255, 159, 64, 1)', tension: 0.4,
            pointRadius: 5, pointHoverRadius: 8, pointBackgroundColor: 'rgba(255, 159, 64, 1)', pointBorderColor: '#fff', pointBorderWidth: 2,
        }],
    };

    const myBookingsChartData = {
        labels: dashboardData?.my_monthly_bookings?.map(item => item.month) || [], // Added optional chaining
        datasets: [{
            label: 'My Total Bookings',
            data: dashboardData?.my_monthly_bookings?.map(item => item.total_bookings) || [], // Added optional chaining
            fill: false,
            borderColor: 'rgba(54, 162, 235, 1)',
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
        }],
    };

    // Helper function to capture and add chart to PDF
    const addChartToPdf = async (doc, chartRef, title, yOffset) => {
        if (chartRef.current) {
            // Get the immediate parent of the chart canvas, which is the div you want to capture
            const chartContainer = chartRef.current.closest('.chart-container');
            if (chartContainer) {
                const canvas = await html2canvas(chartContainer, {
                    scale: 2, // Increase scale for better quality
                    useCORS: true, // Important if your charts use external images/fonts
                    logging: false, // Disable logging for cleaner console
                });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 180; // Standard A4 width (210mm) - margin
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                doc.text(title, 14, yOffset);
                doc.addImage(imgData, 'PNG', 14, yOffset + 5, imgWidth, imgHeight);
                return yOffset + imgHeight + 20; // Return new Y offset for the next element
            }
        }
        return yOffset; // Return original Y offset if chart not found/captured
    };

    const handleGeneratePdf = async () => {
        setGeneratingPdf(true);
        const doc = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size
        let yOffset = 20; // Initial Y position for content

        doc.setFontSize(18);
        doc.text('Statistical Dashboard Report', 14, yOffset);
        yOffset += 10;
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, yOffset);
        yOffset += 20; // Space after title

        // Add KPIs as a simple table or text
        doc.setFontSize(12);
        doc.text('Key Performance Indicators:', 14, yOffset);
        yOffset += 7;

        if (user?.user_type === 'admin') {
            const kpiData = [
                ['Total Resources', dashboardData.total_resources],
                ['Total Bookings', dashboardData.total_bookings],
                ['Total Users', dashboardData.total_users],
                ['Available Resources', dashboardData.available_resources],
            ];
            doc.autoTable({
                startY: yOffset,
                head: [['Metric', 'Value']],
                body: kpiData,
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [50, 50, 150] }
            });
            yOffset = doc.autoTable.previous.finalY + 15;
        } else {
            const myKpiData = [
                ['My Total Bookings', dashboardData.my_total_bookings || 'N/A'],
                ['My Upcoming Bookings', dashboardData.my_upcoming_bookings_count || 'N/A'],
            ];
            doc.autoTable({
                startY: yOffset,
                head: [['Metric', 'Value']],
                body: myKpiData,
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [50, 50, 150] }
            });
            yOffset = doc.autoTable.previous.finalY + 15;
        }


        // Add charts based on user type
        if (user?.user_type === 'admin') {
           yOffset = await addChartToPdf(doc, bookingsByStatusChartRef, 'Bookings by Status', yOffset);
            doc.addPage();
            yOffset = 20;
            yOffset = await addChartToPdf(doc, topBookedResourcesChartRef, 'Top 5 Most Booked Resources', yOffset);
            doc.addPage();
            yOffset = 20;
            yOffset = await addChartToPdf(doc, resourcesAvailabilityChartRef, 'Resource Availability Overview', yOffset);
            doc.addPage();
            yOffset = 20;

            yOffset = await addChartToPdf(doc, monthlyBookingsChartRef, 'Monthly Overall Booking Trends', yOffset); // <--- CHANGE monthlyBookingsChartData TO monthlyBookingsChartRef
            doc.addPage();
            yOffset = 20;
            yOffset = await addChartToPdf(doc, resourceUtilizationChartRef, 'Resource Utilization (Booked Hours) Over Time', yOffset);
            
        } else {
            yOffset = await addChartToPdf(doc, myBookingsChartRef, 'My Personal Booking Trends', yOffset);
            doc.addPage();
            yOffset = 20;
            yOffset = await addChartToPdf(doc, topBookedResourcesChartRef, 'Overall Popular Resources', yOffset);
            doc.addPage();
            yOffset = 20;
            yOffset = await addChartToPdf(doc, currentResourceAvailabilityChartRef, 'Current Resource Availability', yOffset);
        }

        doc.save('Statistical_Dashboard_Report.pdf');
        setGeneratingPdf(false);
    };


    if (loading) {
        return <div className="dashboard-loading">Loading dashboard data...</div>;
    }

    if (error) {
        return <div className="dashboard-error">{error}</div>;
    }

    if (!dashboardData) {
        return <div className="dashboard-empty">No dashboard data available.</div>;
    }

    return (
        <div className="statistical-dashboard">
            <h2>{user?.user_type === 'admin' ? 'Admin Statistical Dashboard' : 'My Resource Usage Dashboard'}</h2>

            <hr />

            <div className="generate-pdf-button-container">
                <button onClick={handleGeneratePdf} disabled={generatingPdf || !dashboardData}>
                    {generatingPdf ? 'Generating PDF...' : 'Download Statistical Report PDF'}
                </button>
            </div>

                       
            <div className="kpi-cards">
                <div className="kpi-card">
                    <h3>Total Resources</h3>
                    <p>{dashboardData.kpis.total_resources}</p>
                </div>
                <div className="kpi-card">
                    <h3>Total Bookings</h3>
                    <p>{dashboardData.kpis.total_bookings}</p>
                </div>
                <div className="kpi-card">
                    <h3>Total Users</h3>
                    <p>{dashboardData.kpis.total_users}</p>
                </div>
                <div className="kpi-card">
                    <h3>Available Resources</h3>
                    <p>{dashboardData.kpis.available_resources}</p>
                </div>
            </div>
            <div className="chart-grid">
                {user?.user_type === 'admin' && (
                    <>
                        <div className="chart-container" ref={bookingsByStatusChartRef}>
                            <h3>Bookings by Status</h3>
                            <Pie data={bookingsByStatusChartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: false } } }} />
                        </div>

                        <div className="chart-container" ref={topBookedResourcesChartRef}>
                            <h3>Top 5 Most Booked Resources</h3>
                            <Bar data={topBookedResourcesChartData} options={{ responsive: true, indexAxis: 'y', plugins: { legend: { display: false }, title: { display: false } }, scales: { x: { beginAtZero: true } } }} />
                        </div>

                        <div className="chart-container" ref={resourcesAvailabilityChartRef}>
                            <h3>Resource Availability Overview</h3>
                            <Doughnut data={resourcesAvailabilityChartData} options={{ responsive: true, plugins: { legend: { position: 'right' }, title: { display: false } } }} />
                        </div>

                        <div className="chart-container" ref={monthlyBookingsChartRef}>
                            <h3>Monthly Overall Booking Trends</h3>
                            <Line data={monthlyBookingsChartData} options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' } },
                                scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Bookings' } }, x: { title: { display: true, text: 'Month' } } }
                            }} />
                        </div>

                        <div className="chart-container" ref={resourceUtilizationChartRef}>
                            <h3>Resource Utilization (Booked Hours) Over Time</h3>
                            <Line data={resourceUtilizationChartData} options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' } },
                                scales: { y: { beginAtZero: true, title: { display: true, text: 'Total Booked Hours' } }, x: { title: { display: true, text: 'Month' } } }
                            }} />
                        </div>
                    </>
                )}

                {user?.user_type !== 'admin' && (
                    <>
                        <div className="chart-container" ref={myBookingsChartRef}>
                            <h3>My Personal Booking Trends</h3>
                            <Line data={myBookingsChartData} options={{
                                responsive: true,
                                plugins: { legend: { position: 'top' } },
                                scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Bookings' } }, x: { title: { display: true, text: 'Month' } } }
                            }} />
                        </div>

                        <div className="chart-container" ref={topBookedResourcesChartRef}> {/* Re-using for user view */}
                            <h3>Overall Popular Resources</h3>
                            <Bar data={topBookedResourcesChartData} options={{
                                responsive: true,
                                indexAxis: 'y',
                                plugins: { legend: { display: false }, title: { display: false } },
                                scales: { x: { beginAtZero: true, title: { display: true, text: 'Number of Bookings' } } }
                            }} />
                        </div>

                        <div className="chart-container" ref={currentResourceAvailabilityChartRef}>
                            <h3>Current Resource Availability</h3>
                            <Bar data={{
                                labels: dashboardData.resource_availability?.filter(r => r.name === 'Available').map(r => r.name) || [],
                                datasets: [{
                                    label: 'Available Count',
                                    data: dashboardData.resource_availability?.filter(r => r.name === 'Available').map(r => r.count) || [],
                                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 1,
                                }]
                            }} options={{
                                responsive: true,
                                plugins: { legend: { display: false }, title: { display: false } },
                                scales: { y: { beginAtZero: true, title: { display: true, text: 'Count' } } }
                            }} />
                            <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#555' }}>*This is a simplified view. For real-time slot availability, check the booking page.</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}