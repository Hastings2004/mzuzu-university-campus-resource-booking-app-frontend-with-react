import { createContext, useEffect, useState } from "react";

export const AppContext = createContext()

export default function AppProvider({children}){

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(null);

    async function getUser() {
        const response = await fetch("/api/user", {
            headers:{
                Authorization: `Bearer ${token}` ,
            },
        });
        
        const data = await response.json();

        if(response.ok){
            setUser(data);
        }
       
    }

    useEffect(()=>{
        if(token){
            getUser();
        }
    }, [token]);
    return(
        <AppContext.Provider value={{token, setToken, user, setUser}}>
            {children}
        </AppContext.Provider>

    );
}