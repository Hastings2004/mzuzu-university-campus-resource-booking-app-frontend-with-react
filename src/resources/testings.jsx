import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/appContext";

export default function Drop(){
     //const {token} = useContext(AppContext);

     const [courses, setCourses] = useState([]);

     async function getCourses() {
        const res = await fetch("/api/allcourses");

        const data = res.json();
        console.log(data);
        if(res.ok){
          setCourses(data);
           
        }
        
     }

     useEffect(()=>{
        getCourses();
     },[])

    return(
        <>
            <h1>Hello</h1>
            <select className="input" id="level"   >
                <option value="">--Select Course Code--</option>
                    {courses.length > 0 ? courses.map(course => (
                        <option key={course.id} value={course.id}>
                                {course.course_name}
                        </option>
                    )): <option>no</option>}
            </select>
        </>
    )
}
