import axios from 'axios';

const api = axios.create({
    baseURL: "https://13-239-185-127.sslip.io/api",
    withCredentials: true
});

api.interceptors.response.use(
    response => response,
    error => {
        const message =
            error.response?.data?.message ||
            error.message ||
            'Request failed';

        return Promise.reject(new Error(message));
    }
);

export default api;