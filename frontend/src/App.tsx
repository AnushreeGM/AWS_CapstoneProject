import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/users`, { name, email });
      setName('');
      setEmail('');
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>User Management App</h1>
        
        {/* User Form */}
        <div className="form-container">
          <h2>Add New User</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>

        {/* Users List */}
        <div className="users-container">
          <h2>Users ({users.length})</h2>
          {users.length === 0 ? (
            <p>No users found. Add some users above!</p>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <small>Added: {new Date(user.created_at).toLocaleDateString()}</small>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
// Pipeline test - Sun Jun 22 03:12:27 AM +0530 2025
