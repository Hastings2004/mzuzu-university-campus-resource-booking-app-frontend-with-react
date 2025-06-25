import { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../context/appContext";
import { useNavigate, useParams } from "react-router-dom";

export default function UpdateResource() {
    const { id } = useParams();
    const { token, user } = useContext(AppContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        capacity: '',
        availability_status: 'available', // Default value
        image: null,
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [currentImage, setCurrentImage] = useState(null);
    const imageInputRef = useRef(null);

    useEffect(() => {
        if (!token || user?.user_type !== 'admin') {
            setMessage("You are not authorized to view this page.");
            setTimeout(() => navigate('/'), 2000);
            return;
        }
        getResource();
    }, [id, token, user, navigate]);

    async function getResource() {
        try {
            const res = await fetch(`/api/resources/${id}`, {
                method: "get",
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            const data = await res.json();

            if (res.ok) {
                const resource = data.resource || data.data || data;
                setFormData({
                    name: resource.name || '',
                    description: resource.description || '',
                    location: resource.location || '',
                    capacity: resource.capacity || '',
                    availability_status: resource.availability_status || 'available',
                    image: resource.image || null,
                });
            } else {
                throw new Error(data.message || "Failed to fetch resource data.");
            }
        } catch (error) {
            console.error("Error fetching resource:", error);
            setMessage(error.message);
            setErrors({ general: error.message });
        }
    }

    async function handleUpdate(e) {
        e.preventDefault();
        setMessage('');
        setErrors({});

        if (!window.confirm("Are you sure you want to update this resource?")) {
            return;
        }

        const dataToSend = new FormData();
        dataToSend.append('name', formData.name);
        dataToSend.append('description', formData.description);
        dataToSend.append('location', formData.location);
        dataToSend.append('capacity', formData.capacity);
        dataToSend.append('availability_status', formData.availability_status);

        if (formData.image) {
            dataToSend.append('image', formData.image);
        }

        try {
            const response = await fetch(`/api/resources/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    // Don't set Content-Type header - browser will set it for FormData
                },
                body: dataToSend
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    throw new Error(data.message || `An error occurred: ${response.statusText}`);
                }
            } else {
                setMessage("Resource updated successfully!");
                setTimeout(() => {
                    navigate(`/resources/view/${id}`);
                }, 1500);
            }
        } catch (error) {
            console.error("Update error:", error);
            setMessage(error.message);
            setErrors({ general: error.message });
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        
        setFormData(prev => ({ ...prev, image: file }));
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

    if (!user || user.user_type !== 'admin') {
        return (
            <div className="container">
                <p>{message || "Redirecting..."}</p>
            </div>
        );
    }
    
    return (
        <div className="container">
            <div className="content">
                <h3>Edit Resource</h3>
                {message && <p className={`message ${errors.general ? 'error' : 'success'}`}>{message}</p>}
                <form onSubmit={handleUpdate}>
                    <div className="form-content">
                        <div className="form-detail">
                            <label htmlFor="name">Resource Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Resource Name"
                                className="input"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && <p className="error">{errors.name[0]}</p>}
                        </div>

                        <div className="form-detail">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Resource Description"
                                className="input"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                            ></textarea>
                            {errors.description && <p className="error">{errors.description[0]}</p>}
                        </div>

                        <div className="form-detail">
                            <label htmlFor="location">Location</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                placeholder="Location"
                                className="input"
                                value={formData.location}
                                onChange={handleChange}
                            />
                            {errors.location && <p className="error">{errors.location[0]}</p>}
                        </div>

                        <div className="form-detail">
                            <label htmlFor="capacity">Capacity</label>
                            <input
                                type="number"
                                id="capacity"
                                name="capacity"
                                placeholder="Capacity"
                                className="input"
                                value={formData.capacity}
                                onChange={handleChange}
                            />
                            {errors.capacity && <p className="error">{errors.capacity[0]}</p>}
                        </div>

                        {/* Image Upload */}
                        <div className="form-detail">
                            <label htmlFor="image">Resource Image (Optional)</label>
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
                            
                            {/* Image Preview */}
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
                                            setFormData(prev => ({ ...prev, image: null }));
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

                        <div className="form-detail">
                            <button type="submit">Update Resource</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}