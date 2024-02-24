import { useState } from 'react'
import axios from 'axios'

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://localhost:3001/register', {
            username,
            password,
            email
        })
            .then(res => {
                switch (res.status) {
                    case 200:
                        alert("Succesfully registered");
                        window.location.href = '/login';
                        break;
                    default:
                        alert(res.data);
                        console.log(res.data);
                        break;
                }
            })
            .catch(err => {
                console.error(err);
                alert(err.response.data);
            })
    }

    return (
        <div className="w-full h-screen flex justify-center">
            <form onSubmit={handleSubmit} className='my-auto flex flex-col'>
                <input onChange={(e) => setUsername(e.target.value)} value={username} className='bg-slate-200 my-2 px-2 py-1' type="text" placeholder="username" />
                <input onChange={(e) => setPassword(e.target.value)} value={password} className='bg-slate-200 my-2 px-2 py-1' type="password" placeholder="password" />
                <input onChange={(e) => setEmail(e.target.value)} value={email} className='bg-slate-200 my-2 px-2 py-1' type="email" placeholder="email" />
                <button className='hover:bg-slate-100 p-2' type="submit">Register</button>
            </form>
        </div>
    )
}

export default Register