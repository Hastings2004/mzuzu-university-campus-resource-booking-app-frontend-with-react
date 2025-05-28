import { use, useContext, useState } from "react";
import { AppContext } from "../context/appContext";
import { useNavigate } from "react-router-dom";

export default function Create(){
    const {token} = useContext(AppContext);
    const navigate = useNavigate();
    
    //const [course, setCourse] = useState([]);
    const [formData, setFormData] = useState({
            level: "",
            course_code: "",
            course_name:"",
        });

    const [errors, setErrors] = useState({});

  

    async function handleCreate(e) {
        e.preventDefault();
       
        const response = await fetch("/api/courses", {
            method: "post",
            headers: {
                Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify(formData)
        });
       
        const data = await response.json();
       

        if(data.errors){
            setErrors(data.errors);
        }
        else{
           navigate("/");
           console.log(data);
            
        }
        
    } 
    

    return(
            <>
                <div className="container">
                   
                <div className="content">
                    <div>
                        <h3>Add Course</h3>
                    </div>
                    <form onSubmit={handleCreate}>
                       <div className="form-content">
                        
                            <div className="form-detail">
                               
                            </div>
                            <div className="form-detail">
                                <label htmlFor="course name">Level</label>
                                <select className="input" id="level"  value={formData.level}  onChange={(e) => setFormData({...formData, level: e.target.value})} >
                                    <option value="">--Select level--</option>
                                    <option value="1">Level 1</option>
                                    <option value="2">Level 2</option>
                                    <option value="3">Level 3</option>
                                    <option value="4">Level 4</option>
                                </select>
                                {errors.level && <p className="error">{errors.level[0]}</p>}


                            </div>
                            <div className="form-detail">
                            <label htmlFor="course name">Course Code</label>                            
                               <select name="" className="input"  value={formData.course_code} onChange={(e) => setFormData({...formData, course_code: e.target.value})}>
                                    <option value="">--select course code---</option>
                                    <option value="BICT3501">BICT3501</option>
                                    <option value="BICT3502">BICT3502</option>
                                    <option value="BICT3503">BICT3503</option>
                                    <option value="BICT3504">BICT3504</option>
                                    <option value="BICT3505">BICT3504</option>
                                   
                               </select>
                                
                                {errors.course_code && <p className="error">{errors.course_code[0]}</p>}


                            </div>
                            <div className="form-detail">
                                <label htmlFor="course name">Course name</label>
                                <select name="" className="input"  value={formData.course_name} onChange={(e) => setFormData({...formData, course_name: e.target.value})}>
                                    <option value="">--select course code---</option>
                                    <option value="Networks II">Networks II</option>
                                    <option value="Research methods">Research methods</option>
                                    <option value="Data structures and algorithm">Data structures and algorithm</option>
                                    <option value="Mobile telecommunication">Mobile telecommunication</option>
                                    <option value="Web programming">Web programming</option>
                                   
                               </select>
                                
                                {errors.course_name && <p className="error">{errors.course_name[0]}</p>}


                            </div>
                            <div className="form-detail">
                                <button>Add Course</button>
                            </div>


                        </div>
                    </form>

                </div>


            </div>
            


        </>
    )
}