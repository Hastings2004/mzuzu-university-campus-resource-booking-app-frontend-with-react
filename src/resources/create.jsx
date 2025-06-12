import { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../context/appContext";
import { useNavigate } from "react-router-dom";

export default function CreateResource() {
    // Access the context to get the token and user information
    const { token, user } = useContext(AppContext);
    const navigate = useNavigate();

    // State for form data, including new resource fields and an image file
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        location: "",
        capacity: "",
        status: "available", 
        image: null, 
    });

    const [errors, setErrors] = useState({});
    
    const [message, setMessage] = useState('');

    const imageInputRef = useRef(null);

    // Effect to check if the user is an admin on component mount
    useEffect(() => {
        // If user is not available or not an admin, redirect
        if (!user || user.user_type !== 'admin') {
            alert("Unauthorized access. Only administrators can create resources.");
            navigate('/'); 
        }
    }, [user, navigate]); 

    // Handle changes for text/select inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors(prevErrors => ({ ...prevErrors, [name]: undefined })); // Clear specific error on change
        setMessage(''); // Clear general message on change
    };

    // Handle file input changes
    const handleImageChange = (e) => {
        const file = e.target.files[0]; // Get the first selected file
        setFormData({ ...formData, image: file });
        setErrors(prevErrors => ({ ...prevErrors, image: undefined })); // Clear image error
        setMessage(''); // Clear general message
    };

    // Handle form submission
    async function handleCreate(e) {
        e.preventDefault();
        setErrors({}); // Clear previous errors
        setMessage(''); // Clear previous messages

        // Client-side validation (optional, but good for immediate feedback)
        if (!formData.name.trim()) {
            setErrors({ name: ['Resource name is required.'] });
            return;
        }
        if (!formData.description.trim()) {
            setErrors({ description: ['Description is required.'] });
            return;
        }
        if (!formData.location.trim()) {
            setErrors({ location: ['Location is required.'] });
            return;
        }
        if (!formData.capacity || isNaN(formData.capacity) || parseInt(formData.capacity) <= 0) {
            setErrors({ capacity: ['Capacity must be a positive number.'] });
            return;
        }
        if (!formData.status) {
            setErrors({ status: ['Status is required.'] });
            return;
        }
        // Image is optional, so no required validation here unless you want to make it mandatory

        // Create FormData object for sending multipart/form-data (required for file uploads)
        const dataToSend = new FormData();
        dataToSend.append('name', formData.name);
        dataToSend.append('description', formData.description);
        dataToSend.append('location', formData.location);
        dataToSend.append('capacity', formData.capacity);
        dataToSend.append('status', formData.status);
        if (formData.image) { 
            dataToSend.append('image', formData.image);
        }

        try {
            const response = await fetch("/api/resources", { 
                method: "POST", // Use POST for creation
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: dataToSend, 
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || "Resource created successfully!");
                // Clear the form after successful creation
                setFormData({
                    name: "",
                    description: "",
                    location: "",
                    capacity: "",
                    status: "available",
                    image: null,
                });
                // Clear the file input visually
                if (imageInputRef.current) {
                    imageInputRef.current.value = "";
                }
                navigate("/"); // Navigate to home or resource list page
            } else {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors); // Set backend validation errors
                    setMessage(data.message || "Please correct the form errors.");
                } else {
                    setMessage(data.message || "Failed to create resource. Please try again.");
                }
                console.error("API Error:", data);
            }
        } catch (error) {
            setMessage("An unexpected error occurred. Please check your network and try again.");
            console.error("Network Error:", error);
        }
    }

    if (!user || user.user_type !== 'admin') {
        return null; // Or a simple "Access Denied" message
    }

    return (
        <>
            <div className="container">
                <div className="content">
                    <div>
                        <h3>Add New Resource</h3>
                    </div>
                    {message && (
                        <p className={message.includes('successfully') ? 'success-message' : 'error-message'}>
                            {message}
                        </p>
                    )}
                    <form onSubmit={handleCreate}>
                        <div className="form-content">
                            {/* Resource Name */}
                            <div className="form-detail">
                                <label htmlFor="name">Resource Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    placeholder="e.g., ICT LAB 1, Room A"
                                    className={`input ${errors.name ? 'input-error' : ''}`}
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                                {errors.name && <p className="error-text">{errors.name[0]}</p>}
                            </div>

                            {/* Description */}
                            <div className="form-detail">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="A brief description of the resource..."
                                    className={`input ${errors.description ? 'input-error' : ''}`}
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                ></textarea>
                                {errors.description && <p className="error-text">{errors.description[0]}</p>}
                            </div>

                            {/* Location */}
                            <div className="form-detail">
                                <label htmlFor="location">Location</label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    placeholder="e.g., ESSAP Buildings or TTC corridor"
                                    className={`input ${errors.location ? 'input-error' : ''}`}
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                                {errors.location && <p className="error-text">{errors.location[0]}</p>}
                            </div>

                            {/* Capacity */}
                            <div className="form-detail">
                                <label htmlFor="capacity">Capacity (Number of people)</label>
                                <input
                                    type="number"
                                    id="capacity"
                                    name="capacity"
                                    placeholder="e.g., 10"
                                    className={`input ${errors.capacity ? 'input-error' : ''}`}
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    min="1" // Capacity should be at least 1
                                />
                                {errors.capacity && <p className="error-text">{errors.capacity[0]}</p>}
                            </div>

                            {/* Status */}
                            <div className="form-detail">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    className={`input ${errors.status ? 'input-error' : ''}`}
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="available">Available</option>
                                    <option value="booked">Booked</option>
                                    <option value="maintenance">Under Maintenance</option>
                                    <option value="unavailable">Unavailable</option>
                                </select>
                                {errors.status && <p className="error-text">{errors.status[0]}</p>}
                            </div>

                            {/* Image Upload */}
                            <div className="form-detail">
                                <label htmlFor="image">Resource Image (Optional)</label>
                                <input
                                    type="file"
                                    id="image"
                                    name="image"
                                    accept="image/*" // Only allow image files
                                    className={`input-file ${errors.image ? 'input-error' : ''}`}
                                    onChange={handleImageChange}
                                    ref={imageInputRef} // Attach ref to clear input
                                />
                                {errors.image && <p className="error-text">{errors.image[0]}</p>}
                            </div>

                            {/* Submit Button */}
                            <div className="form-detail">
                                <button type="submit">Add Resource</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}