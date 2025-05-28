import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/appContext";
import { useNavigate, useParams } from "react-router-dom";

export default function Update(){
    const {id} = useParams();

    const {token, user} = useContext(AppContext);

    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
            level: '',
            resource_code: '',
            resource_name:'',
        });
    const [errors, setErrors] = useState({});

    async function getresource() {
        const res = await fetch(`/api/resources/${id}`,{
            method: "get",
            headers:{
                Authorization: `Bearer ${token}`,
            }
        });    
        const data = await res.json();

        
        if(res.ok){

            if(!data.resources.user_id === user.id){
                navigate("/");
            }
            setFormData({
               // student_id: data.resources.student_id,
                level: data.resources.level,
                resource_code: data.resources.resource_code,
                resource_name: data.resources.resource_name,
            });
        }
    }

    async function handleUpdate(e) {
       
        e.preventDefault();

        confirm("Are you sure to update ");
       
        const response = await fetch(`/api/resources/${id}`, {
            method: "put",
            headers: {
                Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify(formData)
        });
       
        const data = await response.json();
       

        if(data.errors){
            setErrors(data.errors);
            //console.log(data.errors);
        }
        else{
           navigate("/");
           console.log(data);
            
        }
        

    }    
    useEffect(()=>{
        getresource();
    }, [])
    return(
            <>
                <div className="container">
                <div className="content">
                    <div>
                        <h3>Add resource</h3>
                    </div>
                    <form onSubmit={handleUpdate}>
                        <div className="form-content">
                            <div className="form-detail">
                                <label htmlFor="resource name">Level</label>
                                <input 
                                    type="text" 
                                    placeholder="Level" 
                                    className="input" 
                                    value={formData.level}
                                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                            
                                />
                                {errors.level && <p className="error">{errors.level[0]}</p>}


                            </div>
                            <div className="form-detail">
                            <label htmlFor="resource name">resource Code</label>
                                <input 
                                    type="text" 
                                    placeholder="resource code" 
                                    className="input" 
                                    value={formData.resource_code}
                                    onChange={(e) => setFormData({...formData, resource_code: e.target.value})}
                            
                                />
                                {errors.resource_code && <p className="error">{errors.resource_code[0]}</p>}


                            </div>
                            <div className="form-detail">
                            <label htmlFor="resource name">resource Name</label>
                                <input 
                                    type="text" 
                                    placeholder="resource name" 
                                    className="input" 
                                    value={formData.resource_name}
                                    onChange={(e) => setFormData({...formData, resource_name: e.target.value})}
                            
                                />
                                {errors.resource_name && <p className="error">{errors.resource_name[0]}</p>}


                            </div>
                            <div className="form-detail">
                                <button>Update</button>
                            </div>


                        </div>
                    </form>

                </div>


            </div>
            


        </>
    )
}