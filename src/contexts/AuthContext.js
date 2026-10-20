// src/contexts/AuthContext.js
import React, { createContext, useContext } from 'react';

const AuthContext = createContext({ user: null, logout: () => {}, isAdmin: false });

export const AuthProvider = ({ user, logout, children }) => (
  <AuthContext.Provider value={{ user, logout, isAdmin: !!user && user.role === 'admin' }}>
    {children}
  </AuthContext.Provider>
);

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
