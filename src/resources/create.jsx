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
    const [imagePreview, setImagePreview] = useState(null);
    const imageInputRef = useRef(null);

    // Effect to check if the user is an admin on component mount
    useEffect(() => {
        if (!user || user.user_type !== 'admin') {
            alert("Unauthorized access. Only administrators can create resources.");
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
        
        // Validate file type
        if (file && !file.type.startsWith('image/')) {
            setErrors(prevErrors => ({ ...prevErrors, image: ['Please select a valid image file.'] }));
            setMessage('');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file && file.size > 5 * 1024 * 1024) {
            setErrors(prevErrors => ({ ...prevErrors, image: ['Image file size must be less than 5MB.'] }));
            setMessage('');
            return;
        }
        
        setFormData({ ...formData, image: file });
        setErrors(prevErrors => ({ ...prevErrors, image: undefined }));
        setMessage('');

        // Create image preview
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    // Handle form submission
    async function handleCreate(e) {
        e.preventDefault();
        setErrors({});
        setMessage('');

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
                },
                body: dataToSend, 
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || "Resource created successfully!");
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
                    imageInputRef.current.value = ""; 
                }
                setImagePreview(null); 
                setErrors({});
                setTimeout(() => navigate("/"), 2000);
            } else {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                    setMessage(data.message || "Please correct the form errors.");
                } else {
                    setMessage(data.message || "Failed to create resource. Please try again.");
                }
                console.error("API Error (backend response data):", data); 
            }
        } catch (error) {
            setMessage("An unexpected error occurred. Please check your network and try again.");
            console.error("Network Error (during fetch):", error);
        }
    }

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
                                    min="1" 
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
                            
                            {/* Image Upload */}
                            <div className="form-detail">
                                <label htmlFor="image">Resource Image</label>
                                <input
                                    type="file"
                                    id="image"
                                    name="image"
                                    accept="image/*" 
                                    className={`input ${errors.image ? 'input-error' : ''}`}
                                    onChange={handleImageChange}
                                    ref={imageInputRef} 
                                />
                                <p className="help-text">Supported formats: JPG, PNG, GIF. Maximum size: 5MB</p>
                                {errors.image && <p className="error-text">{errors.image[0]}</p>}
                                
                                {/*Image Preview */}
                                {imagePreview && (
                                    <div className="image-preview-container">
                                        <img 
                                            src={imagePreview} 
                                            alt="Resource preview" 
                                            className="image-preview"
                                        />
                                        <button 
                                            type="button" 
                                            className="remove-image-btn"
                                            onClick={() => {
                                                setFormData({ ...formData, image: null });
                                                setImagePreview(null);
                                                if (imageInputRef.current) {
                                                    imageInputRef.current.value = "";
                                                }
                                            }}
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                )}
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