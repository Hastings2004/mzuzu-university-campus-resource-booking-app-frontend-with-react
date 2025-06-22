import { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../context/appContext";
import { useNavigate } from "react-router-dom";

export default function CreateResource() {
    // Access the context to get the token and user information
    const { token, user } = useContext(AppContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        location: "",
        capacity: "",
        category: "",
        status: "available",
        image: null,
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const imageInputRef = useRef(null);

    // Effect to check if the user is an admin on component mount
    useEffect(() => {
        if (!user || user.user_type !== 'admin') {
            //alert("Unauthorized access. Only administrators can create resources.");
            navigate('/');
        }
    }, [user, navigate]);

    // Handle changes for text/select inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
        setMessage('');
    };

    // Handle file input changes
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, image: file });
        setErrors(prevErrors => ({ ...prevErrors, image: undefined }));
        setMessage('');
    };

    // Handle form submission
    async function handleCreate(e) {
        e.preventDefault();
        setErrors({});
        setMessage('');

        // Client-side validation (optional, but good for immediate feedback)
        // This client-side validation is basic. Your backend validation (StoreResourceRequest)
        // will be the definitive source of truth and more robust.
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
        if (!formData.category) {
            setErrors({ category: ['Category is required.'] });
            return;
        }
        if (!formData.status) {
            setErrors({ status: ['Status is required.'] });
            return;
        }

        const dataToSend = new FormData();

        dataToSend.append('name', formData.name);
        dataToSend.append('description', formData.description);
        dataToSend.append('location', formData.location);
        dataToSend.append('capacity', formData.capacity);
        dataToSend.append('category', formData.category);
        dataToSend.append('status', formData.status);

        if (formData.image) {
            dataToSend.append('image', formData.image);
        }

        // Log the FormData contents for debugging
        console.log("FormData contents being sent:");
        for (let pair of dataToSend.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }

        try {
            const response = await fetch("/api/resources", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    // REMOVE THE 'Content-Type': 'application/json' HEADER!
                    // The browser will automatically set 'multipart/form-data'
                },
                body: dataToSend, // **CORRECTION: Send dataToSend, not formData**
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || "Resource created successfully!");
                // Optionally clear the form after success
                setFormData({
                    name: "",
                    description: "",
                    location: "",
                    capacity: "",
                    category: "",
                    status: "available",
                    image: null,
                });
                if (imageInputRef.current) {
                    imageInputRef.current.value = ""; // Clear file input
                }
                setErrors({});
                // Navigate after a short delay to allow message to be seen
                setTimeout(() => navigate("/"), 2000);
            } else {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                    setMessage(data.message || "Please correct the form errors.");
                } else {
                    setMessage(data.message || "Failed to create resource. Please try again.");
                }
                console.error("API Error (backend response data):", data); // Log the full error from backend
            }
        } catch (error) {
            setMessage("An unexpected error occurred. Please check your network and try again.");
            console.error("Network Error (during fetch):", error);
        }
    }

    // This check should be placed after the imports and before the return statement
    // so that the component doesn't render if unauthorized.
    if (!user || user.user_type !== 'admin') {
        return null;
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
                            <div className="form-detail">
                                <label htmlFor="category">Category:</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className={`form-input ${errors.category ? 'input-error' : ''}`}
                                >
                                    <option value="">Select a category</option>
                                    <option value="classrooms">Classrooms</option>
                                    <option value="ict_labs">ICT Labs</option>
                                    <option value="science_labs">Science Labs</option>
                                    <option value="auditorium">Auditorium</option>
                                    <option value="sports">Sports</option>
                                    <option value="cars">Cars</option>
                                </select>
                                {errors.category && <p className="error-message">{errors.category[0]}</p>}
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