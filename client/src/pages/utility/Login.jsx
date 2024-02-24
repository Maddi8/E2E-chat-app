import axios from 'axios';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../provider/authProvider';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { setToken } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://localhost:3001/auth', {
            username,
            password
        })
        .then(res => {
            switch (res.status) {
                case 200:
                    setToken(JSON.stringify(res.data.token));
                    localStorage.setItem('id', res.data.id);
                    navigate("/chat", { replace: true });
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
                <input required onChange={(e) => setUsername(e.target.value)} value={username} className='bg-slate-200 my-2 px-2 py-1' type="text" placeholder="username" />
                <input required onChange={(e) => setPassword(e.target.value)} value={password} className='bg-slate-200 my-2 px-2 py-1' type="password" placeholder="password" />
                <button className='hover:bg-slate-100 p-2' type="submit">Login</button>
            </form>
        </div>
    )
}

export default Login