import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                const response = await api.get('/auth/me');

                if (isMounted) {
                    setUser(response.data.user);
                }
            } catch (error) {
                if (isMounted) {
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setChecking(false);
                }
            }
        };

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const value = {
        user,
        setUser,
        checking,
        isSuperAdmin: user?.role === 'superadmin',
        isAdmin: user?.role === 'admin',
        isEmployee: user?.role === 'employee'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);