import { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../context/appContext";
import { useNavigate } from "react-router-dom";

export default function NewsCreate(){
    const { token, user } = useContext(AppContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        content: "",
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

        // will be the definitive source of truth and more robust.
        if (!formData.title.trim()) {
            setErrors({ title: ['News title is required.'] });
            return;
        }
        if (!formData.content.trim()) {
            setErrors({ content: ['Description is required.'] });
            return;
        }
        
        const dataToSend = new FormData();

        dataToSend.append('title', formData.title);
        dataToSend.append('content', formData.content);
     
        if (formData.image) {
            dataToSend.append('image', formData.image);
        }

        // Log the FormData contents for debugging
        console.log("FormData contents being sent:");
        for (let pair of dataToSend.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }

        try {
            const response = await fetch("/api/news", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: dataToSend, 
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || "Resource created successfully!");
                // Optionally clear the form after success
                setFormData({
                    title: "",
                    content: "",
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
    
    if (!user || user.user_type !== 'admin') {
        return null;
    }

    return (
        <>
            <div className="container">
                <div className="content">
                    <div>
                        <h3>Add News</h3>
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
                                <label htmlFor="title">News Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    placeholder="e.g., News Title"
                                    className={`input ${errors.title ? 'input-error' : ''}`}
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                                {errors.title && <p className="error-text">{errors.title[0]}</p>}
                            </div>

                            {/* Description */}
                            <div className="form-detail">
                                <label htmlFor="content">Content </label>
                                <textarea
                                    id="description"
                                    name="content"
                                    placeholder="A content of the news..."
                                    className={`input ${errors.content ? 'input-error' : ''}`}
                                    value={formData.content}
                                    onChange={handleChange}
                                    rows="3"
                                ></textarea>
                                {errors.content && <p className="error-text">{errors.content[0]}</p>}
                            </div>
                             <div className="form-detail">
                                <button type="submit">Submit</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}