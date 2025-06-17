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
            {/* ... other resource details */}
            <button onClick={() => setShowReportModal(true)}>Report Issue</button>

            {showReportModal && (
                <Modal onClose={() => setShowReportModal(false)}>
                    <ReportIssueForm
                        resourceId={resource.id}
                        resourceName={resource.name}
                        onClose={() => setShowReportModal(false)}
                        onIssueReported={handleIssueReported}
                    />
                </Modal>
            )}
        </div>
    );
}