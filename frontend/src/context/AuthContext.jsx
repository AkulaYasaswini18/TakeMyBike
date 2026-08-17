import React from 'react'

const AuthContext = React.createContext({ user: null })

export const AuthProvider = ({ children }) => {
  return <AuthContext.Provider value={{ user: null }}>{children}</AuthContext.Provider>
}

export default AuthContext
