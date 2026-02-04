import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { RoutePath } from '../types';

interface SimpleAuthRouteProps {
    children: React.ReactNode;
}

const SimpleAuthRoute: React.FC<SimpleAuthRouteProps> = ({ children }) => {
    const { currentUser } = useStore();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to={RoutePath.LOGIN} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default SimpleAuthRoute;
