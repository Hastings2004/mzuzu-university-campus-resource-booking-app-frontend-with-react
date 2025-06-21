import { useContext, useEffect, useState, useRef } from "react"; 
import { AppContext } from "../context/appContext";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement } from "chart.js";
import 'chart.js/auto';
import jsPDF from 'jspdf'; 
import html2canvas from 'html2canvas'; 
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel } from 'docx';
import logoImage from '../assets/logo.png';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement);

export default function Statistical() {

    const { user, token } = useContext(AppContext);

    const [dashboardData, setDashboardData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [generatingPdf, setGeneratingPdf] = useState(false); 
    const [generatingExcel, setGeneratingExcel] = useState(false);
    const [generatingWord, setGeneratingWord] = useState(false);

    // Refs for each chart container for capturing with html2canvas

    const bookingsByStatusChartRef = useRef(null);

    const topBookedResourcesChartRef = useRef(null);

    const resourcesAvailabilityChartRef = useRef(null);

    const monthlyBookingsChartRef = useRef(null);

    const resourceUtilizationChartRef = useRef(null);

    const myBookingsChartRef = useRef(null);

    const currentResourceAvailabilityChartRef = useRef(null); 

    useEffect(() => {

        const fetchDashboardData = async () => {

            if (!user) { 

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

    const bookingsByStatusChartData = {

        labels: Object.keys(dashboardData?.bookings_by_status || {}), 

        datasets: [{

            label: 'Number of Bookings',

            data: Object.values(dashboardData?.bookings_by_status || {}), 

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

        labels: dashboardData?.resource_availability?.map(r => r.name) || [], 

        datasets: [{

            label: 'Availability Status',

            data: dashboardData?.resource_availability?.map(r => r.count) || [], 

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

        labels: dashboardData?.my_monthly_bookings?.map(item => item.month) || [], 

        datasets: [{

            label: 'My Total Bookings',

            data: dashboardData?.my_monthly_bookings?.map(item => item.total_bookings) || [], 

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
           
            const chartContainer = chartRef.current.closest('.chart-container');
            if (chartContainer) {
                const canvas = await html2canvas(chartContainer, {
                    scale: 1.5, // Reduced from 2 to 1.5 for smaller size
                    useCORS: true, 
                    logging: false, 
                });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 140; // Reduced from 180 to 140 for smaller charts
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Check if chart would overflow the page
                if (yOffset + imgHeight + 30 > doc.internal.pageSize.height - 30) {
                    doc.addPage();
                    yOffset = 20;
                }

                doc.setFontSize(12);
                doc.setFont('times', 'bold');
                doc.text(title, 14, yOffset);
                doc.addImage(imgData, 'PNG', 14, yOffset + 5, imgWidth, imgHeight);
                return yOffset + imgHeight + 25; // Reduced spacing from 20 to 25
            }
        }
        return yOffset; 
    };

    // Excel Export Function
    const handleGenerateExcel = async () => {
        setGeneratingExcel(true);
        
        try {
            const wb = XLSX.utils.book_new();
            
            // KPIs Sheet
            const kpiData = [];
            if (user?.user_type === 'admin') {
                kpiData.push(['Key Performance Indicators', '']);
                kpiData.push(['Total Resources', dashboardData?.kpis?.total_resources || 'N/A']);
                kpiData.push(['Total Bookings', dashboardData?.kpis?.total_bookings || 'N/A']);
                kpiData.push(['Total Users', dashboardData?.kpis?.total_users || 'N/A']);
                kpiData.push(['Available Resources', dashboardData?.kpis?.available_resources || 'N/A']);
            } else {
                kpiData.push(['My Statistics', '']);
                kpiData.push(['My Total Bookings', dashboardData?.my_total_bookings || 'N/A']);
                kpiData.push(['My Upcoming Bookings', dashboardData?.my_upcoming_bookings_count || 'N/A']);
            }
            
            const kpiWs = XLSX.utils.aoa_to_sheet(kpiData);
            XLSX.utils.book_append_sheet(wb, kpiWs, 'KPIs');
            
            // Bookings by Status Sheet
            if (dashboardData?.bookings_by_status) {
                const statusData = [['Status', 'Count']];
                Object.entries(dashboardData.bookings_by_status).forEach(([status, count]) => {
                    statusData.push([status, count]);
                });
                const statusWs = XLSX.utils.aoa_to_sheet(statusData);
                XLSX.utils.book_append_sheet(wb, statusWs, 'Bookings by Status');
            }
            
            // Top Booked Resources Sheet
            if (dashboardData?.top_booked_resources) {
                const resourceData = [['Resource Name', 'Total Bookings']];
                dashboardData.top_booked_resources.forEach(resource => {
                    resourceData.push([resource.resource_name, resource.total_bookings]);
                });
                const resourceWs = XLSX.utils.aoa_to_sheet(resourceData);
                XLSX.utils.book_append_sheet(wb, resourceWs, 'Top Booked Resources');
            }
            
            // Monthly Bookings Sheet
            if (dashboardData?.monthly_bookings) {
                const monthlyData = [['Month', 'Total Bookings']];
                dashboardData.monthly_bookings.forEach(item => {
                    monthlyData.push([item.month, item.total_bookings]);
                });
                const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyData);
                XLSX.utils.book_append_sheet(wb, monthlyWs, 'Monthly Bookings');
            }
            
            // Resource Utilization Sheet
            if (dashboardData?.resource_utilization_monthly) {
                const utilizationData = [['Month', 'Total Booked Hours']];
                dashboardData.resource_utilization_monthly.forEach(item => {
                    utilizationData.push([item.month, item.total_booked_hours]);
                });
                const utilizationWs = XLSX.utils.aoa_to_sheet(utilizationData);
                XLSX.utils.book_append_sheet(wb, utilizationWs, 'Resource Utilization');
            }
            
            // My Monthly Bookings Sheet (for non-admin users)
            if (dashboardData?.my_monthly_bookings && user?.user_type !== 'admin') {
                const myMonthlyData = [['Month', 'My Total Bookings']];
                dashboardData.my_monthly_bookings.forEach(item => {
                    myMonthlyData.push([item.month, item.total_bookings]);
                });
                const myMonthlyWs = XLSX.utils.aoa_to_sheet(myMonthlyData);
                XLSX.utils.book_append_sheet(wb, myMonthlyWs, 'My Monthly Bookings');
            }
            
            // Save the file
            XLSX.writeFile(wb, 'Statistical_Dashboard_Report.xlsx');
        } catch (error) {
            console.error('Error generating Excel file:', error);
            alert('Error generating Excel file. Please try again.');
        } finally {
            setGeneratingExcel(false);
        }
    };

    // Word Export Function
    const handleGenerateWord = async () => {
        setGeneratingWord(true);
        
        try {
            const children = [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Statistical Dashboard Report",
                            bold: true,
                            size: 32,
                        }),
                    ],
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                            italics: true,
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: "",
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Key Performance Indicators",
                            bold: true,
                            size: 24,
                        }),
                    ],
                    heading: HeadingLevel.HEADING_1,
                }),
            ];

            // Add KPI table
            if (user?.user_type === 'admin') {
                const kpiTable = new Table({
                    width: {
                        size: 100,
                        type: WidthType.PERCENTAGE,
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("Metric")],
                                }),
                                new TableCell({
                                    children: [new Paragraph("Value")],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("Total Resources")],
                                }),
                                new TableCell({
                                    children: [new Paragraph(String(dashboardData?.kpis?.total_resources || 'N/A'))],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("Total Bookings")],
                                }),
                                new TableCell({
                                    children: [new Paragraph(String(dashboardData?.kpis?.total_bookings || 'N/A'))],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("Total Users")],
                                }),
                                new TableCell({
                                    children: [new Paragraph(String(dashboardData?.kpis?.total_users || 'N/A'))],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("Available Resources")],
                                }),
                                new TableCell({
                                    children: [new Paragraph(String(dashboardData?.kpis?.available_resources || 'N/A'))],
                                }),
                            ],
                        }),
                    ],
                });
                children.push(kpiTable);
            } else {
                const userKpiTable = new Table({
                    width: {
                        size: 100,
                        type: WidthType.PERCENTAGE,
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("Metric")],
                                }),
                                new TableCell({
                                    children: [new Paragraph("Value")],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("My Total Bookings")],
                                }),
                                new TableCell({
                                    children: [new Paragraph(String(dashboardData?.my_total_bookings || 'N/A'))],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("My Upcoming Bookings")],
                                }),
                                new TableCell({
                                    children: [new Paragraph(String(dashboardData?.my_upcoming_bookings_count || 'N/A'))],
                                }),
                            ],
                        }),
                    ],
                });
                children.push(userKpiTable);
            }

            // Add spacing
            children.push(new Paragraph({ text: "" }));

            // Add bookings by status table
            if (dashboardData?.bookings_by_status) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Bookings by Status",
                                bold: true,
                                size: 20,
                            }),
                        ],
                        heading: HeadingLevel.HEADING_2,
                    })
                );

                const statusRows = [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph("Status")] }),
                            new TableCell({ children: [new Paragraph("Count")] }),
                        ],
                    }),
                ];

                Object.entries(dashboardData.bookings_by_status).forEach(([status, count]) => {
                    statusRows.push(
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(status)] }),
                                new TableCell({ children: [new Paragraph(String(count))] }),
                            ],
                        })
                    );
                });

                const statusTable = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: statusRows,
                });

                children.push(statusTable);
                children.push(new Paragraph({ text: "" }));
            }

            // Add top booked resources table
            if (dashboardData?.top_booked_resources) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Top Booked Resources",
                                bold: true,
                                size: 20,
                            }),
                        ],
                        heading: HeadingLevel.HEADING_2,
                    })
                );

                const resourceRows = [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph("Resource Name")] }),
                            new TableCell({ children: [new Paragraph("Total Bookings")] }),
                        ],
                    }),
                ];

                dashboardData.top_booked_resources.forEach(resource => {
                    resourceRows.push(
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(resource.resource_name)] }),
                                new TableCell({ children: [new Paragraph(String(resource.total_bookings))] }),
                            ],
                        })
                    );
                });

                const resourceTable = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: resourceRows,
                });

                children.push(resourceTable);
                children.push(new Paragraph({ text: "" }));
            }

            // Add monthly bookings table
            if (dashboardData?.monthly_bookings) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Monthly Bookings",
                                bold: true,
                                size: 20,
                            }),
                        ],
                        heading: HeadingLevel.HEADING_2,
                    })
                );

                const monthlyRows = [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph("Month")] }),
                            new TableCell({ children: [new Paragraph("Total Bookings")] }),
                        ],
                    }),
                ];

                dashboardData.monthly_bookings.forEach(item => {
                    monthlyRows.push(
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(item.month)] }),
                                new TableCell({ children: [new Paragraph(String(item.total_bookings))] }),
                            ],
                        })
                    );
                });

                const monthlyTable = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: monthlyRows,
                });

                children.push(monthlyTable);
                children.push(new Paragraph({ text: "" }));
            }

            // Add resource utilization table
            if (dashboardData?.resource_utilization_monthly) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Resource Utilization",
                                bold: true,
                                size: 20,
                            }),
                        ],
                        heading: HeadingLevel.HEADING_2,
                    })
                );

                const utilizationRows = [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph("Month")] }),
                            new TableCell({ children: [new Paragraph("Total Booked Hours")] }),
                        ],
                    }),
                ];

                dashboardData.resource_utilization_monthly.forEach(item => {
                    utilizationRows.push(
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(item.month)] }),
                                new TableCell({ children: [new Paragraph(String(item.total_booked_hours))] }),
                            ],
                        })
                    );
                });

                const utilizationTable = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: utilizationRows,
                });

                children.push(utilizationTable);
                children.push(new Paragraph({ text: "" }));
            }

            // Add my monthly bookings table for non-admin users
            if (dashboardData?.my_monthly_bookings && user?.user_type !== 'admin') {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "My Monthly Bookings",
                                bold: true,
                                size: 20,
                            }),
                        ],
                        heading: HeadingLevel.HEADING_2,
                    })
                );

                const myMonthlyRows = [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph("Month")] }),
                            new TableCell({ children: [new Paragraph("My Total Bookings")] }),
                        ],
                    }),
                ];

                dashboardData.my_monthly_bookings.forEach(item => {
                    myMonthlyRows.push(
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(item.month)] }),
                                new TableCell({ children: [new Paragraph(String(item.total_bookings))] }),
                            ],
                        })
                    );
                });

                const myMonthlyTable = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: myMonthlyRows,
                });

                children.push(myMonthlyTable);
            }

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: children,
                }],
            });

            // Generate and save the document
            const buffer = await Packer.toBuffer(doc);
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Statistical_Dashboard_Report.docx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating Word document:', error);
            alert('Error generating Word document. Please try again.');
        } finally {
            setGeneratingWord(false);
        }
    };

    const handleGeneratePdf = async () => {

        setGeneratingPdf(true);

        const doc = new jsPDF('p', 'mm', 'a4'); 

        // Set font to Times New Roman
        doc.setFont('times', 'normal');

        // Add logo
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
        const reportText = 'Statistical Dashboard Report';
        const reportTextWidth = doc.getTextWidth(reportText);
        const reportTextX = (pageWidth - reportTextWidth) / 2;
        doc.text(reportText, reportTextX, 60);
        
        // Add generation date
        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString();
        doc.text(`Generated on: ${currentDate} at ${currentTime}`, 14, 80);
        
        // Add user type information
        doc.text(`User Type: ${user?.user_type === 'admin' ? 'Administrator' : 'Regular User'}`, 14, 90);
        doc.text(`Report Type: ${user?.user_type === 'admin' ? 'Admin Dashboard Statistics' : 'Personal Usage Statistics'}`, 14, 100);

        let yOffset = 120; // Start after header content

        // Add KPIs as simple text instead of table
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('Key Performance Indicators:', 14, yOffset);
        yOffset += 10;

        if (user?.user_type === 'admin') {          
            doc.setFontSize(10);
            doc.setFont('times', 'normal');
            doc.text(`Total Resources: ${dashboardData?.kpis?.total_resources || 'N/A'}`, 14, yOffset);
            yOffset += 7;
            doc.text(`Total Bookings: ${dashboardData?.kpis?.total_bookings || 'N/A'}`, 14, yOffset);
            yOffset += 7;
            doc.text(`Total Users: ${dashboardData?.kpis?.total_users || 'N/A'}`, 14, yOffset);
            yOffset += 7;
            doc.text(`Available Resources: ${dashboardData?.kpis?.available_resources || 'N/A'}`, 14, yOffset);
            yOffset += 20;

        } else {
            doc.setFontSize(10);
            doc.setFont('times', 'normal');
            doc.text(`My Total Bookings: ${dashboardData?.my_total_bookings || 'N/A'}`, 14, yOffset);
            yOffset += 7;
            doc.text(`My Upcoming Bookings: ${dashboardData?.my_upcoming_bookings_count || 'N/A'}`, 14, yOffset);
            yOffset += 20;
        }

        // Add charts based on user type
        if (user?.user_type === 'admin') {
            yOffset = await addChartToPdf(doc, bookingsByStatusChartRef, 'Bookings by Status', yOffset);
            
            // Check if we need a new page - more conservative check
            if (yOffset > 180) {
                doc.addPage();
                yOffset = 20;
            }
            
            yOffset = await addChartToPdf(doc, topBookedResourcesChartRef, 'Top 5 Most Booked Resources', yOffset);
            
            if (yOffset > 180) {
                doc.addPage();
                yOffset = 20;
            }
            
            yOffset = await addChartToPdf(doc, resourcesAvailabilityChartRef, 'Resource Availability Overview', yOffset);
            
            if (yOffset > 180) {
                doc.addPage();
                yOffset = 20;
            }
            yOffset = await addChartToPdf(doc, monthlyBookingsChartRef, 'Monthly Overall Booking Trends', yOffset);
            
            if (yOffset > 180) {
                doc.addPage();
                yOffset = 20;
            }
            
            yOffset = await addChartToPdf(doc, resourceUtilizationChartRef, 'Resource Utilization (Booked Hours) Over Time', yOffset);
            
        } else {
            yOffset = await addChartToPdf(doc, myBookingsChartRef, 'My Personal Booking Trends', yOffset);
            
            if (yOffset > 180) {
                doc.addPage();
                yOffset = 20;
            }
            
            yOffset = await addChartToPdf(doc, topBookedResourcesChartRef, 'Overall Popular Resources', yOffset);
            
            if (yOffset > 180) {
                doc.addPage();
                yOffset = 20;
            }
            
            yOffset = await addChartToPdf(doc, currentResourceAvailabilityChartRef, 'Current Resource Availability', yOffset);
        }

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

            <div className="generate-pdf-button-container" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

                <button 

                    onClick={handleGeneratePdf} 

                    disabled={generatingPdf || !dashboardData}

                    style={{

                        backgroundColor: generatingPdf ? '#ccc' : '#007bff',

                        color: 'white',

                        padding: '10px 20px',

                        border: 'none',

                        borderRadius: '5px',

                        cursor: generatingPdf ? 'not-allowed' : 'pointer',

                        fontSize: '16px',

                        fontWeight: 'bold',

                        margin: '10px 0'

                    }}

                >

                    {generatingPdf ? 'Generating PDF...' : 'Download PDF Report'}

                </button>

                <button 

                    onClick={handleGenerateExcel} 

                    disabled={generatingExcel || !dashboardData}

                    style={{

                        backgroundColor: generatingExcel ? '#ccc' : '#28a745',

                        color: 'white',

                        padding: '10px 20px',

                        border: 'none',

                        borderRadius: '5px',

                        cursor: generatingExcel ? 'not-allowed' : 'pointer',

                        fontSize: '16px',

                        fontWeight: 'bold',

                        margin: '10px 0'

                    }}

                >

                    {generatingExcel ? 'Generating Excel...' : 'Download Excel Report'}

                </button>

                <button 

                    onClick={handleGenerateWord} 

                    disabled={generatingWord || !dashboardData}

                    style={{

                        backgroundColor: generatingWord ? '#ccc' : '#6f42c1',

                        color: 'white',

                        padding: '10px 20px',

                        border: 'none',

                        borderRadius: '5px',

                        cursor: generatingWord ? 'not-allowed' : 'pointer',

                        fontSize: '16px',

                        fontWeight: 'bold',

                        margin: '10px 0'

                    }}

                >

                    {generatingWord ? 'Generating Word...' : 'Download Word Report'}

                </button>

            </div>

            <div className="kpi-cards">

                <div className="kpi-card">

                    <h3>Total Resources</h3>

                    <p>{dashboardData?.kpis?.total_resources || 'N/A'}</p>

                </div>

                <div className="kpi-card">

                    <h3>Total Bookings</h3>

                    <p>{dashboardData?.kpis?.total_bookings || 'N/A'}</p>

                </div>

                <div className="kpi-card">

                    <h3>Total Users</h3>

                    <p>{dashboardData?.kpis?.total_users || 'N/A'}</p>

                </div>

                <div className="kpi-card">

                    <h3>Available Resources</h3>

                    <p>{dashboardData?.kpis?.available_resources || 'N/A'}</p>

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

                                labels: dashboardData?.resource_availability?.filter(r => r.name === 'Available').map(r => r.name) || [],

                                datasets: [{

                                    label: 'Available Count',

                                    data: dashboardData?.resource_availability?.filter(r => r.name === 'Available').map(r => r.count) || [],

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