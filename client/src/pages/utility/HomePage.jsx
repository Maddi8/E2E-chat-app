import { useEffect } from "react"
import Navbar from "../../components/utility/Navbar"

const HomePage = () => {
  
  useEffect(() => {
    axios.get('http://localhost:3001/checkSession', {
      withCredentials: true, // Include credentials (cookies) in the request
    })
      .then(response => response.data)
      .then(data => {
        if (data.loggedIn) {
          console.log('User is logged in:', data.username);
          // Do something for logged-in users
        } else {
          console.log('User is not logged in');
          // Do something for users not logged in
        }
      })
      .catch(error => {
        console.error('Error checking session:', error);
      });
  }, []);

  return (
    <div className="flex flex-col">
      <Navbar />
    </div>
  )
}

export default HomePage