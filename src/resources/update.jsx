import { useContext, useEffect, useState } from "react";
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
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');

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

        try {
            const response = await fetch(`/api/resources/${id}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData)
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

                        <div className="form-detail">
                            <label htmlFor="availability_status">Availability Status</label>
                            <select
                                id="availability_status"
                                name="availability_status"
                                className="input"
                                value={formData.availability_status}
                                onChange={handleChange}
                            >
                                <option value="available">Available</option>
                                <option value="unavailable">Unavailable</option>
                                <option value="maintenance">Under Maintenance</option>
                            </select>
                            {errors.availability_status && <p className="error">{errors.availability_status[0]}</p>}
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