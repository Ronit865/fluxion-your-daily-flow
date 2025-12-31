import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://sih-project-pojd.onrender.com/api",
  withCredentials: true,
  timeout: 60000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle your ApiResponse and ApiError format
api.interceptors.response.use(
  (response) => {
    // Your backend returns data in ApiResponse format
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle ApiError format from your backend
    if (error.response) {
      const apiError = error.response.data;
      
      // If invalid token error (not expired), clear storage and redirect
      if (apiError.statusCode === 404 && apiError.message === "Invalid Access Token") {
        localStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(apiError);
      }
      
      // Check if it's a 401 unauthorized error and attempt token refresh
      if (error.response.status === 401 && 
          !originalRequest._retry && 
          !originalRequest.url?.includes('/login') &&
          !originalRequest.url?.includes('/refresh-token')) {
        
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (!refreshToken) {
            localStorage.clear();
            window.location.href = '/auth/login';
            return Promise.reject(apiError);
          }

          const refreshResponse = await axios.post(
            `${api.defaults.baseURL}/login/refresh-token`,
            { refreshToken },
            { withCredentials: true }
          );
          
          if (refreshResponse.data?.success && refreshResponse.data?.data?.accessToken) {
            const newAccessToken = refreshResponse.data.data.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            
            return api(originalRequest);
          } else {
            localStorage.clear();
            window.location.href = '/auth/login';
            return Promise.reject(apiError);
          }
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        }
      }
      
      const structuredError = {
        statusCode: apiError.statusCode || error.response.status,
        message: apiError.message || "Something went wrong",
        errors: apiError.errors || [],
        success: false
      };
      
      return Promise.reject(structuredError);
    }
    
    return Promise.reject({
      statusCode: 500,
      message: error.message || "Network error occurred",
      errors: [],
      success: false
    });
  }
);

export default api;