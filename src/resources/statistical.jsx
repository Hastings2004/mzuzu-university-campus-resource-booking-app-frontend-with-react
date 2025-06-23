import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/appContext";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement } from "chart.js";
import 'chart.js/auto';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement);

export default function Statistical() {
    const { user, token } = useContext(AppContext);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) {
        return <div className="dashboard-loading">Loading dashboard data...</div>;
    }

    if (error) {
        return <div className="dashboard-error">{error}</div>;
    }

    if (!dashboardData) {
        return <div className="dashboard-empty">No dashboard data available.</div>;
    }

    // --- Chart Data Preparation (Common & Admin Specific) ---
    const bookingsByStatusChartData = {
        labels: Object.keys(dashboardData.bookings_by_status || {}),
        datasets: [{
            label: 'Number of Bookings',
            data: Object.values(dashboardData.bookings_by_status || {}),
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
        labels: dashboardData.resource_availability?.map(r => r.name) || [],
        datasets: [{
            label: 'Availability Status',
            data: dashboardData.resource_availability?.map(r => r.count) || [],
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
        labels: dashboardData.top_booked_resources?.map(r => r.resource_name) || [],
        datasets: [{
            label: 'Total Bookings',
            data: dashboardData.top_booked_resources?.map(r => r.total_bookings) || [],
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
        }],
    };

    const monthlyBookingsChartData = {
        labels: dashboardData.monthly_bookings?.map(item => item.month) || [],
        datasets: [{
            label: 'Total Bookings',
            data: dashboardData.monthly_bookings?.map(item => item.total_bookings) || [],
            fill: false, borderColor: 'rgba(75, 192, 192, 1)', tension: 0.3,
            pointRadius: 5, pointHoverRadius: 8, pointBackgroundColor: 'rgba(75, 192, 192, 1)', pointBorderColor: '#fff', pointBorderWidth: 2,
        }],
    };

    const resourceUtilizationChartData = {
        labels: dashboardData.resource_utilization_monthly?.map(item => item.month) || [],
        datasets: [{
            label: 'Total Booked Hours',
            data: dashboardData.resource_utilization_monthly?.map(item => item.total_booked_hours) || [],
            fill: true, backgroundColor: 'rgba(255, 159, 64, 0.2)', borderColor: 'rgba(255, 159, 64, 1)', tension: 0.4,
            pointRadius: 5, pointHoverRadius: 8, pointBackgroundColor: 'rgba(255, 159, 64, 1)', pointBorderColor: '#fff', pointBorderWidth: 2,
        }],
    };

    // --- NEW: My Personal Booking Trends Chart Data (for staff/students) ---
    const myBookingsChartData = {
        labels: dashboardData.my_monthly_bookings?.map(item => item.month) || [],
        datasets: [{
            label: 'My Total Bookings',
            data: dashboardData.my_monthly_bookings?.map(item => item.total_bookings) || [],
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


    // --- Render based on User Type ---
    if (user?.user_type === 'admin') {
        return (
            <div className="statistical-dashboard">
                <h2>Admin Statistical Dashboard</h2>
                {user?.first_name && <p>Welcome, {user.first_name}!</p>}
                <hr />

                <div className="kpi-cards">
                    <div className="kpi-card">
                        <h3>Total Resources</h3>
                        <p>{dashboardData.total_resources}</p>
                    </div>
                    <div className="kpi-card">
                        <h3>Total Bookings</h3>
                        <p>{dashboardData.total_bookings}</p>
                    </div>
                    <div className="kpi-card">
                        <h3>Total Users</h3>
                        <p>{dashboardData.total_users}</p>
                    </div>
                    <div className="kpi-card">
                        <h3>Available Resources</h3>
                        <p>{dashboardData.available_resources}</p>
                    </div>
                </div>

                <div className="chart-grid">
                    <div className="chart-container">
                        <h3>Bookings by Status</h3>
                        <Pie data={bookingsByStatusChartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: false } } }} />
                    </div>

                    <div className="chart-container">
                        <h3>Top 5 Most Booked Resources</h3>
                        <Bar data={topBookedResourcesChartData} options={{ responsive: true, indexAxis: 'y', plugins: { legend: { display: false }, title: { display: false } }, scales: { x: { beginAtZero: true } } }} />
                    </div>

                    <div className="chart-container">
                        <h3>Resource Availability Overview</h3>
                        <Doughnut data={resourcesAvailabilityChartData} options={{ responsive: true, plugins: { legend: { position: 'right' }, title: { display: false } } }} />
                    </div>

                    <div className="chart-container">
                        <h3>Monthly Overall Booking Trends</h3>
                        <Line data={monthlyBookingsChartData} options={{
                            responsive: true,
                            plugins: { legend: { position: 'top' } },
                            scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Bookings' } }, x: { title: { display: true, text: 'Month' } } }
                        }} />
                    </div>

                    <div className="chart-container">
                        <h3>Resource Utilization (Booked Hours) Over Time</h3>
                        <Line data={resourceUtilizationChartData} options={{
                            responsive: true,
                            plugins: { legend: { position: 'top' } },
                            scales: { y: { beginAtZero: true, title: { display: true, text: 'Total Booked Hours' } }, x: { title: { display: true, text: 'Month' } } }
                        }} />
                    </div>
                </div>
            </div>
        );
    } else { // Staff or Student View
        return (
            <div className="statistical-dashboard user-dashboard">
                <h2>My Resource Usage Dashboard</h2>
                {user?.first_name && <p>Welcome, {user.first_name}!</p>}
                <hr />

                <div className="kpi-cards">
                    {/* You might want to show some personal KPIs here, e.g., total bookings */}
                    <div className="kpi-card">
                        <h3>My Total Bookings</h3>
                        <p>{dashboardData.my_total_bookings || 'N/A'}</p> {/* Assumes backend provides this */}
                    </div>
                    <div className="kpi-card">
                        <h3>My Upcoming Bookings</h3>
                        <p>{dashboardData.my_upcoming_bookings_count || 'N/A'}</p> {/* Assumes backend provides this */}
                    </div>
                </div>

                <div className="chart-grid">
                    <div className="chart-container">
                        <h3>My Personal Booking Trends</h3>
                        <Line data={myBookingsChartData} options={{
                            responsive: true,
                            plugins: { legend: { position: 'top' } },
                            scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Bookings' } }, x: { title: { display: true, text: 'Month' } } }
                        }} />
                    </div>

                    {/* Popular Resources (can be useful for all users) */}
                    <div className="chart-container">
                        <h3>Overall Popular Resources</h3>
                        <Bar data={topBookedResourcesChartData} options={{
                            responsive: true,
                            indexAxis: 'y', // Makes it a horizontal bar chart
                            plugins: { legend: { display: false }, title: { display: false } },
                            scales: { x: { beginAtZero: true, title: { display: true, text: 'Number of Bookings' } } }
                        }} />
                    </div>

                    {/* Example of a simplified "Available Resources by Category" for users */}
                    {/* This would require specific data from the backend */}
                    <div className="chart-container">
                        <h3>Current Resource Availability</h3>
                        {/* This chart might be more complex if you want real-time dynamic availability by type.
                            For now, re-using resourcesAvailabilityChartData might just show static resource counts by status.
                            A better chart here would count 'available now' vs 'total' per resource category.
                            For simplicity, let's assume it lists categories with their 'available' count.
                        */}
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
                        <p style={{textAlign: 'center', fontSize: '0.9em', color: '#555'}}>*This is a simplified view. For real-time slot availability, check the booking page.</p>
                    </div>

                </div>
            </div>
        );
    }
}