import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

const Header = ({ onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const isLoggedIn = useSelector((state) => state?.auth?.isLoggedIn);
    const role = useSelector((state) => state?.auth?.role);
    const avatar = useSelector((state) => state?.auth?.data?.avatar?.secure_url);
    const name = useSelector((state) => state?.auth?.data?.name);
    const firstName = name ? name.split(" ")[0] : "";

    const toggleMenu = () => setIsOpen(!isOpen);

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Courses", path: "/courses" },
        { name: "About", path: "/about" },
        { name: "Contact", path: "/contact" },
    ];

    return (
        <header className="w-full bg-transparent text-white fixed top-0 left-0 z-50 border-b border-white/10">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
                <Link to="/" className="text-2xl font-bold text-yellow-400">
                    SMART LMS
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex gap-8 items-center">
                    {navLinks.map(link => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`bg-transparent hover:text-yellow-400 font-medium transition-colors duration-200 ${
                                location.pathname === link.path ? "text-yellow-400" : "text-white"
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {!isLoggedIn ? (
                        <>
                            <Link to="/login">
                                <button className="bg-transparent border border-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-400 hover:text-black transition-all duration-300">
                                    Login
                                </button>
                            </Link>
                            <Link to="/signup">
                                <button className="bg-transparent border border-yellow-400 text-yellow-400 px-4 py-2 rounded hover:bg-yellow-400 hover:text-black transition-all duration-300">
                                    Sign Up
                                </button>
                            </Link>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            {role === "ADMIN" && (
                                <Link to="/admin/dashboard" className="text-yellow-400 hover:underline">
                                    Admin Dashboard
                                </Link>
                            )}

                            {role === "INSTRUCTOR" && (
                                <Link to="/instructor/dashboard/home" className="text-yellow-400 hover:underline">
                                    Instructor Dashboard
                                </Link>
                            )}

                            <Link to="/profile" className="flex items-center gap-2">
                                <img
                                    src={avatar}
                                    alt="avatar"
                                    className="w-8 h-8 rounded-full border border-yellow-400"
                                />
                                <span className="capitalize font-semibold text-yellow-300">{firstName}</span>
                            </Link>
                            <button
                                onClick={onLogout}
                                className="bg-transparent border border-red-500 text-red-400 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-all duration-300"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </nav>

                {/* Hamburger Icon */}
                <div className="md:hidden text-2xl cursor-pointer text-white" onClick={toggleMenu}>
                    {isOpen ? <FaTimes /> : <FaBars />}
                </div>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden bg-black/90 backdrop-blur-sm w-full px-6 pb-4 flex flex-col gap-4 text-white">
                    {navLinks.map(link => (
                        <Link
                            key={link.name}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            className={`hover:text-yellow-400 font-medium transition-colors duration-200 ${
                                location.pathname === link.path ? "text-yellow-400" : ""
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {!isLoggedIn ? (
                        <>
                            <Link to="/login" onClick={() => setIsOpen(false)}>
                                <button className="w-full py-2 rounded border border-yellow-400 text-white hover:bg-yellow-400 hover:text-black transition-all duration-300">
                                    Login
                                </button>
                            </Link>
                            <Link to="/signup" onClick={() => setIsOpen(false)}>
                                <button className="w-full py-2 rounded border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300">
                                    Sign Up
                                </button>
                            </Link>
                        </>
                    ) : (
                        <>
                            {role === "ADMIN" && (
                                <Link to="/admin/dashboard" onClick={() => setIsOpen(false)}>
                                    <span className="text-yellow-400 hover:underline">Admin Dashboard</span>
                                </Link>
                            )}

                            {role === "INSTRUCTOR" && (
                                <Link to="/instructor/dashboard/home" onClick={() => setIsOpen(false)}>
                                    <span className="text-yellow-400 hover:underline">Instructor Dashboard</span>
                                </Link>
                            )}

                            <Link to="/profile" onClick={() => setIsOpen(false)}>
                                <div className="flex items-center gap-2">
                                    <img
                                        src={avatar}
                                        alt="avatar"
                                        className="w-8 h-8 rounded-full border border-yellow-400"
                                    />
                                    <span className="capitalize font-semibold text-yellow-300">{firstName}</span>
                                </div>
                            </Link>
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsOpen(false);
                                }}
                                className="w-full py-2 rounded border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            )}
        </header>
    );
};

export default Header;
