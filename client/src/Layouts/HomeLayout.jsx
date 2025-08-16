import Cookies from 'js-cookie';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Footer from '../components/Footer';
import Header from '../components/Header';
import { logout } from '../Redux/slices/AuthSlice';

function HomeLayout({ children }) {
    const dispatch = useDispatch();
    const navigate = useNavigate(); // 👈 Required for redirecting after logout

    const isLoggedIn = useSelector((state) => state?.auth?.isLoggedIn);
    const role = useSelector((state) => state?.auth?.role);
    const avatar = useSelector((state) => state?.auth?.data?.avatar?.secure_url);
    const name = useSelector((state) => state?.auth?.data?.name);
    const firstName = name ? name.split(' ')[0] : '';

    const onLogout = async () => {
        await dispatch(logout());
        Cookies.remove('authToken');
        navigate('/'); // 👈 Redirect to home page after logout
    };

    return (
        <div className="relative min-h-screen flex flex-col">
            <Header
                isLoggedIn={isLoggedIn}
                role={role}
                avatar={avatar}
                firstName={firstName}
                onLogout={onLogout}
            />

            <main className="flex-grow pt-20">
                {children}
            </main>

            <Footer />
        </div>
    );
}

export default HomeLayout;
