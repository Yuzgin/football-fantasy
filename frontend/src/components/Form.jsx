import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';
import "../styles/Form.css";

function Form({ route, method }) {
    const [email, setEmail] = useState(''); // Changed from 'username' to 'email'
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = method === "login" ? "Login" : "Register";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const res = await api.post(route, { email, password }); // Changed from 'username' to 'email'
            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate('/');
            } else {
                navigate('/login');
            }
        } catch (error) {
            alert(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className='form_container'>
            <h1>{name}</h1>
            <input className='form-input'
                type='email' // Changed input type to 'email'
                value={email} // Changed from 'username' to 'email'
                onChange={(e) => setEmail(e.target.value)} // Changed from 'setUsername' to 'setEmail'
                placeholder='Email' // Changed placeholder to 'Email'
            />
            <input className='form-input'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Password'
            />
            <button className='form-button' type='submit'>{name}</button>
        </form>
    );
}

export default Form;
