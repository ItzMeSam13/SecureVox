'use client';
import React from 'react';

const App = () => {
    const handleFormSubmit = (e) => {
        e.preventDefault();
        console.log('Form submission prevented. In a real app, this data would be sent to a server.');
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        console.log('Form Data:', data);
    };

    return (
        <div className="bg-[#0d1a2f] flex items-center justify-center min-h-screen p-4">
            
            {/* Login Card Container */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl w-full max-w-xl p-10" style={{ minHeight: '350px' }}>
                
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-1">Secure Vox</h1>
                    <p className="text-xl font-medium text-gray-300">AI Voice Security</p>
                    <p className="text-xs text-gray-400 mt-1">Secure Access | Synthetic Voice Detection</p>
                </div>

                {/* Form Section */}
                <form id="loginForm" className="space-y-4" onSubmit={handleFormSubmit}>
                    {/* Official Email Input */}
                    <div>
                        <label htmlFor="officialEmail" className="block text-sm font-medium text-gray-300 mb-1">Official Email</label>
                        <input 
                            type="email" 
                            id="officialEmail" 
                            name="officialEmail" 
                            placeholder="Enter your email"
                            className="w-full px-4 py-2 bg-[#0d1a2f] text-gray-200 border border-gray-600 rounded-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            placeholder="Enter your password"
                            className="w-full px-4 py-2 bg-[#0d1a2f] text-gray-200 border border-gray-600 rounded-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Log In Button */}
                    <button 
                        type="submit" 
                        className="w-full py-3 mt-6 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
                    >
                        Log In
                    </button>
                </form>

                {/* OR Separator */}
                <div className="relative flex items-center my-4">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-500">OR</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>

                {/* Log in with Google Button */}
                <button 
                    className="w-full py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 transition-colors shadow-md"
                >
                    Log in with Google
                </button>

                {/* Don't have an account? Sign up link */}
                <p className="mt-8 text-center text-gray-400 text-sm">
                    Don't have an account? <a href="/SignUp" className="text-blue-400 hover:underline">Sign Up</a>
                </p>

            </div>
        </div>
    );
};

export default App;
