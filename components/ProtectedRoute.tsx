import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { RoutePath } from '../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { currentUser } = useStore();
    const location = useLocation();

    // If we wanted a loading state, we would check strict auth loading here.
    // Assuming currentUser is null if not logged in (after init).
    // Note: onAuthStateChanged in StoreContext handles initial load, but 
    // if we strictly need spinner while auth is checking, we might need a separate 'loading' flag from store.
    // For now, based on prompt: "If !currentUser (Not logged in) -> Redirect to /login"

    if (!currentUser) {
        // Redirect to login, but save the location they were trying to go to
        return <Navigate to={RoutePath.LOGIN} state={{ from: location }} replace />;
    }

    // Check roles: Allow 'SUPER_ADMIN' and 'MEMBER_ADMIN'
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MEMBER_ADMIN';

    if (!isAdmin) {
        return <Navigate to={RoutePath.TRANSPARENCY} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
