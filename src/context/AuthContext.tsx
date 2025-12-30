import React, { createContext, useContext, useEffect, useState } from 'react';
import { userService, adminService, handleApiError, handleApiSuccess } from '@/services/ApiServices';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  graduationYear?: string;
  course?: string;
  currentPosition?: string;
  company?: string;
  location?: string;
  phone?: string;
  bio?: string;
  linkedinUrl?: string;
}

interface Admin {
  name: string;
  _id: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  login: (userData: any) => void;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  updateUserData: (userData: User | Admin) => void;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  userType: 'user' | 'admin' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUserType = localStorage.getItem('userType') as 'user' | 'admin' | null;
      
      if (token && storedUserType) {
        setUserType(storedUserType);
        
        // Load cached data immediately
        if (storedUserType === 'admin') {
          const cachedAdmin = localStorage.getItem('cachedAdminData');
          if (cachedAdmin) {
            try {
              const adminData = JSON.parse(cachedAdmin);
              setAdmin(adminData);
              setUser(null);
              if (adminData._id) {
                localStorage.setItem('userId', adminData._id);
              }
            } catch (e) {
              console.warn('Failed to parse cached admin data');
            }
          }
        } else {
          const cachedUser = localStorage.getItem('cachedUserData');
          if (cachedUser) {
            try {
              const userData = JSON.parse(cachedUser);
              setUser(userData);
              setAdmin(null);
              if (userData._id) {
                localStorage.setItem('userId', userData._id);
              }
            } catch (e) {
              console.warn('Failed to parse cached user data');
            }
          }
        }
        
        setIsInitialized(true);
        setIsLoading(false);
        
        // Fetch fresh data in background
        try {
          await fetchCurrentUser();
        } catch (error) {
          console.error('Background fetch failed:', error);
        }
      } else {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const storedUserType = localStorage.getItem('userType') as 'user' | 'admin' | null;
      
      if (!storedUserType) {
        return;
      }

      let response;
      if (storedUserType === 'admin') {
        response = await adminService.getCurrentAdmin();
        
        // Try different possible structures
        let adminData = null;
        if (response?.data?.data) {
          adminData = response.data.data;
        } else if (response?.data) {
          adminData = response.data;
        } else if (response) {
          adminData = response;
        }
        
        if (adminData && adminData.name && adminData.email) {
          setAdmin(adminData);
          setUser(null);
          localStorage.setItem('cachedAdminData', JSON.stringify(adminData));
          if (adminData._id) {
            localStorage.setItem('userId', adminData._id);
          }
        }
      } else {
        response = await userService.getCurrentUser();
        
        // Try different possible structures
        let userData = null;
        if (response?.data?.data) {
          userData = response.data.data;
        } else if (response?.data) {
          userData = response.data;
        } else if (response) {
          userData = response;
        }
        
        if (userData && userData.name && userData.email) {
          setUser(userData);
          setAdmin(null);
          localStorage.setItem('cachedUserData', JSON.stringify(userData));
          if (userData._id) {
            localStorage.setItem('userId', userData._id);
          }
        }
      }
      
      setUserType(storedUserType);
    } catch (error: any) {
      // Keep cached data on error
      console.warn('Keeping cached data due to fetch error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = (userData: User | Admin) => {
    const storedUserType = localStorage.getItem('userType');
    
    if (storedUserType === 'admin') {
      setAdmin(userData as Admin);
      localStorage.setItem('cachedAdminData', JSON.stringify(userData));
      if (userData._id) {
        localStorage.setItem('userId', userData._id);
      }
    } else {
      setUser(userData as User);
      localStorage.setItem('cachedUserData', JSON.stringify(userData));
      if (userData._id) {
        localStorage.setItem('userId', userData._id);
      }
    }
  };

  const login = (userData: any) => {
    const responseUserType = userData.userType || (userData.user?.role === 'admin' ? 'admin' : 'user');
    const responseUser = userData.user;
    const responseAdmin = userData.admin;
    
    localStorage.setItem('userType', responseUserType);
    setUserType(responseUserType as 'user' | 'admin');
    
    if (userData.accessToken) {
      localStorage.setItem('accessToken', userData.accessToken);
    }

    if (responseUserType === 'admin') {
      const adminData = responseAdmin || userData;
      setAdmin(adminData);
      setUser(null);
      localStorage.setItem('cachedAdminData', JSON.stringify(adminData));
      if (adminData._id) {
        localStorage.setItem('userId', adminData._id);
      }
    } else {
      const userData_ = responseUser || userData;
      setUser(userData_);
      setAdmin(null);
      localStorage.setItem('cachedUserData', JSON.stringify(userData_));
      if (userData_._id) {
        localStorage.setItem('userId', userData_._id);
      }
    }
    
    setIsLoading(false);
    setIsInitialized(true);
  };

  const logout = () => {
    setUser(null);
    setAdmin(null);
    setUserType(null);
    setIsInitialized(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('cachedUserData');
    localStorage.removeItem('cachedAdminData');
    localStorage.removeItem('userId');
  };

  const value = {
    user,
    admin,
    userType,
    login,
    logout,
    fetchCurrentUser,
    updateUserData,
    isLoading,
    isInitialized,
    isAuthenticated: !!(user || admin),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};