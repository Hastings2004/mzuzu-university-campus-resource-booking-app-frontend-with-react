import React, { useState } from 'react';
import ReportIssueForm from '../components/ReportIssueForm';
import Modal from '../components/Modal';

export default function ResourceDetailPage({ resource }) {
    const [showReportModal, setShowReportModal] = useState(false);

    const handleIssueReported = (newIssue) => {
        console.log("Issue reported:", newIssue);
        // Optionally update UI, e.g., show a toast message
    };

    return (
        <div>
            <h1>{resource.name}</h1>
            {/* Google Maps Embed for resource location */}
            <iframe
                width="400"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src="https://www.google.com/maps?q=HXHW+JFF,+Lubinga+Rd,+Mzuzu&z=17&output=embed"
                title="Resource Location"
            />
            <br />
            <a
                href="https://maps.app.goo.gl/qnZb8CfFrDHXAXuj9"
                target="_blank"
                rel="noopener noreferrer"
            >
                View on Google Maps
            </a>
            {/* ... other resource details */}
            <button onClick={() => setShowReportModal(true)}>Report Issue</button>

            {showReportModal && (
                <Modal onClose={() => setShowReportModal(false)}>
                    <ReportIssueForm
                        resourceId={resource.id}
                        name={resource.name}
                        onClose={() => setShowReportModal(false)}
                        onIssueReported={handleIssueReported}
                    />
                </Modal>
            )}
        </div>
    );
}