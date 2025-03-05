import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import "../styles/Form.css";

function ResetPassword() {
    const { uid, token } = useParams();  // Extract UID and token from URL params
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await api.post('/api/reset-password/', {
                uid,
                token,
                new_password: newPassword
            });
            setMessage('Password reset successful. You can now log in.');
            // Optionally, redirect to login page after successful password reset
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setMessage('Error resetting password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='form_container'>
            <h1>Reset Password</h1>
            <input
                className='form-input'
                type='password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder='Enter new password'
            />
            <div className="button-container">
                <button className='form-button' type='submit' disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </div>
            {message && <p>{message}</p>}
        </form>
    );
}

export default ResetPassword;
