import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import "../styles/Form.css";

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await api.post('/api/password-reset/', { email });
            setMessage('Password reset email sent. Please check your inbox.');
        } catch (error) {
            setMessage('Error sending password reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='form_container'>
            <h1>Forgot Password</h1>
            <input
                className='form-input'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter your email'
            />
            <div className="button-container">
                <button className='form-button' type='submit' disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </div>
            {message && <p>{message}</p>}
        </form>
    );
}

export default ForgotPassword;
